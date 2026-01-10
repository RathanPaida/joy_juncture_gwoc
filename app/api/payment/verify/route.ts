import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import connectDb from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';
import {Order} from '@/models/Order';
// check this line
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await connectDb();

    // Verify Firebase token for authentication
    const authHeader = request.headers.get('Authorization');
    let firebaseUid: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        console.log('✅ User authenticated:', firebaseUid);
      } catch (error: any) {
        console.log('⚠️ Firebase auth failed, proceeding without authentication:', error.message);
        // Continue without authentication for backward compatibility
      }
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = await request.json();

    console.log('🔍 Payment verification started');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    console.log('Authenticated User:', firebaseUid);

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('✅ Signature verified');

    // Find order by razorpay_order_id
    const order = await Order.findOne({ 
      razorpayOrderId: razorpay_order_id 
    });

    console.log('Order found:', !!order);

    if (!order) {
      console.error('❌ Order not found for:', razorpay_order_id);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If user is authenticated, verify they own this order
    if (firebaseUid && order.firebaseUid !== firebaseUid) {
      console.error('❌ User does not own this order');
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to order' },
        { status: 403 }
      );
    }

    // If no authentication but order has firebaseUid, try to get from order
    if (!firebaseUid && order.firebaseUid) {
      firebaseUid = order.firebaseUid;
    }

    // Check if payment is already completed
    if (order.status === 'completed') {
      console.log('ℹ️ Payment already completed');
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: order._id.toString()
      });
    }

    // Update order status to completed
    order.status = 'completed';
    order.paymentId = razorpay_payment_id;
    order.updatedAt = new Date();
    await order.save();
    console.log('✅ Order status updated to completed');

    // Process based on order type
    let result: any = {
      success: true,
      orderId: order._id.toString(),
      paymentId: razorpay_payment_id
    };

    if (order.type === 'event') {
      // Event registration payment flow
      const db = await getDatabase();
      const eventsCollection = db.collection('events');
      const registrationsCollection = db.collection('registrations');

      // Get event details
      const event = await eventsCollection.findOne({ 
        _id: new ObjectId(order.eventId) 
      });

      if (!event) {
        console.error('❌ Event not found:', order.eventId);
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        );
      }

      console.log('✅ Event found:', event.name);

      // Check if already registered
      const existingRegistration = await registrationsCollection.findOne({
        eventId: new ObjectId(order.eventId),
        userId: order.userId || firebaseUid,
        paymentStatus: 'completed'
      });

      if (existingRegistration) {
        console.log('ℹ️ User already registered');
        result.registrationId = existingRegistration._id.toString();
        result.message = 'Already registered';
        return NextResponse.json(result);
      }

      // Generate verification code
      const verificationCode = crypto.randomBytes(16).toString('hex');
      const qrData = `${order.eventId}-${order.userId || firebaseUid}-${verificationCode}`;

      // Create registration record
      const registration = {
        eventId: new ObjectId(order.eventId),
        userId: order.userId || firebaseUid,
        userName: order.userName,
        userEmail: order.userEmail,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: order.amount / 100, // Convert from paise to rupees
        verificationCode,
        qrData,
        paymentStatus: 'completed',
        status: 'confirmed',
        coinsAwarded: true,
        attendanceMarked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const registrationResult = await registrationsCollection.insertOne(registration);
      console.log('✅ Registration created:', registrationResult.insertedId);

      // Update event seats
      await eventsCollection.updateOne(
        { _id: new ObjectId(order.eventId) },
        { 
          $inc: { availableSeats: -1 },
          $set: { updatedAt: new Date() }
        }
      );
      console.log('✅ Event seats updated');

      // Award coins for event registration
      const coinsToAdd = event.coins || 0;
      
      if (firebaseUid && coinsToAdd > 0) {
        // Get current user wallet balance
        const currentUser = await User.findOne({ firebaseUid });
        
        if (currentUser) {
          const currentBalance = currentUser.walletBalance || 0;
          const newBalance = currentBalance + coinsToAdd;

          // Update user with coins and registered event
          currentUser.walletBalance = newBalance;
          currentUser.totalPoints = (currentUser.totalPoints || 0) + coinsToAdd;
          
          if (!currentUser.registeredEvents) {
            currentUser.registeredEvents = [];
          }
          currentUser.registeredEvents.push(new ObjectId(order.eventId));
          
          await currentUser.save();
          console.log(`✅ Added ${coinsToAdd} coins to user`);

          // Create transaction record
          try {
            await Transaction.create({
              userId: firebaseUid,
              type: 'event',
              amount: coinsToAdd,
              description: `Coins earned from registering for ${event.name}`,
              referenceId: registrationResult.insertedId.toString(),
              metadata: {
                eventId: order.eventId,
                eventName: event.name,
                registrationId: registrationResult.insertedId.toString(),
                paymentId: razorpay_payment_id
              },
              balanceAfter: newBalance,
              status: 'completed'
            });
            console.log('✅ Transaction record created');
          } catch (txError) {
            console.error('❌ Transaction creation error:', txError);
          }
        }
      }

      result.registrationId = registrationResult.insertedId.toString();
      result.coinsAwarded = coinsToAdd;
      result.message = 'Event registration confirmed';

    } else if (order.type === 'store' || !order.type) {
      // Store purchase flow (default)
      // Calculate Joy Points (total ÷ 10)
      const joyPoints = Math.floor(order.totalAmount / 10);
      console.log('🎁 Joy points to add:', joyPoints);
      
      if (firebaseUid && joyPoints > 0) {
        // Update BOTH walletBalance AND totalPoints
        const userUpdate = await User.findOneAndUpdate(
          { firebaseUid },
          { 
            $inc: { 
              walletBalance: joyPoints,
              totalPoints: joyPoints
            } 
          },
          { new: true }
        );

        if (userUpdate) {
          console.log('✅ User wallet updated:', userUpdate.walletBalance);
          console.log('✅ User points updated:', userUpdate.totalPoints);

          // Create transaction record for store purchase
          try {
            await Transaction.create({
              userId: firebaseUid,
              type: 'store',
              amount: joyPoints,
              description: `Joy Points earned from store purchase`,
              referenceId: order._id.toString(),
              metadata: {
                orderId: order._id.toString(),
                paymentId: razorpay_payment_id,
                totalAmount: order.totalAmount
              },
              balanceAfter: userUpdate.walletBalance,
              status: 'completed'
            });
            console.log('✅ Store transaction record created');
          } catch (txError) {
            console.error('❌ Transaction creation error:', txError);
          }
        }
      }

      result.joyPointsEarned = joyPoints;
      result.message = 'Store purchase completed';
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Payment verification failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Payment verification failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}