// app/api/payment/verify/route.ts - COMPLETE WITH CART CLEARING
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDb from '@/lib/mongodb';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId, MongoClient } from 'mongodb';
import { Order } from '@/models/Order';
import { User, Transaction } from '@/models/User';
import { verifyIdToken } from '@/lib/firebase-admin';
import { sendEventRegistrationEmail, sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDb();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      type // 'event' or 'product'
    } = await request.json();

    console.log('🔍 Payment verification started');
    console.log('Type:', type);
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('✅ Signature verified');

    // Route to appropriate handler based on type
    if (type === 'event') {
      return await handleEventPayment(
        razorpay_order_id,
        razorpay_payment_id,
        request
      );
    } else {
      // Default to product payment (for backward compatibility)
      return await handleProductPayment(
        razorpay_order_id,
        razorpay_payment_id,
        request
      );
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Payment verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleEventPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  request: NextRequest
) {
  try {
    const db = await getDatabase();
    const ordersCollection = db.collection('orders');
    const registrationsCollection = db.collection('registrations');
    const eventsCollection = db.collection('events');
    const usersCollection = db.collection('users');

    // Find order by razorpay_order_id
    const order = await ordersCollection.findOne({
      razorpayOrderId: razorpay_order_id
    });

    console.log('Event order found:', !!order);

    if (!order) {
      console.error('❌ Order not found for:', razorpay_order_id);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

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
      userId: order.userId,
      paymentStatus: 'completed'
    });

    if (existingRegistration) {
      console.log('ℹ️ User already registered');
      return NextResponse.json({
        success: true,
        registrationId: existingRegistration._id.toString(),
        message: 'Already registered'
      });
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(16).toString('hex');
    const qrData = `${order.eventId}-${order.userId}-${verificationCode}`;

    // Create registration record
    const registration = {
      eventId: new ObjectId(order.eventId),
      userId: order.userId,
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

    // Update user: Add coins and register event
    const coinsToAdd = event.coins || 0;

    // Get current user wallet balance
    const currentUser = await usersCollection.findOne({
      firebaseUid: order.userId
    });

    const currentBalance = currentUser?.walletBalance || 0;
    const newBalance = currentBalance + coinsToAdd;

    // Update user with coins and registered event
    await usersCollection.updateOne(
      { firebaseUid: order.userId },
      {
        $inc: { walletBalance: coinsToAdd, totalPoints: coinsToAdd },
        $addToSet: { registeredEvents: new ObjectId(order.eventId) },
        $set: {
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`✅ Added ${coinsToAdd} coins to user`);

    // Create transaction record
    try {
      await Transaction.create({
        userId: order.userId,
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
      // Continue even if transaction logging fails
    }

    // Update order status
    await ordersCollection.updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          status: 'completed',
          paymentId: razorpay_payment_id,
          updatedAt: new Date()
        }
      }
    );
    console.log('✅ Order status updated');

    // Send confirmation email
    try {
      console.log('📧 Sending event registration email to:', order.userEmail);
      await sendEventRegistrationEmail(
        order.userEmail,
        order.userName,
        event.name,
        event.date || new Date(), // Fallback if date missing
        event.location || 'Online' // Fallback if location missing
      );
    } catch (emailError) {
      console.error('❌ Failed to send event registration email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      registrationId: registrationResult.insertedId.toString(),
      coinsAwarded: coinsToAdd,
      message: 'Payment verified and registration confirmed'
    });
  } catch (error) {
    console.error('❌ Event payment error:', error);
    throw error;
  }
}

async function handleProductPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  request: NextRequest
) {
  try {
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid token' },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;

    // Update all orders for this user that are processing
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const updatedOrders = await Order.updateMany(
      {
        firebaseUid: firebaseUid,
        orderStatus: 'processing',
        purchaseDate: { $gte: tenMinutesAgo }
      },
      {
        $set: {
          orderStatus: 'confirmed',
          paymentStatus: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          paidAt: new Date()
        }
      }
    );

    console.log('✅ Orders updated:', updatedOrders.modifiedCount);

    // Calculate total amount from all updated orders
    const orders = await Order.find({
      firebaseUid: firebaseUid,
      razorpayPaymentId: razorpay_payment_id
    }).lean();

    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    console.log('💰 Total amount:', totalAmount);

    // Calculate Joy Points (total ÷ 10)
    const joyPoints = Math.floor(totalAmount / 10);
    console.log('🎁 Joy points to add:', joyPoints);

    // Update BOTH walletBalance AND totalPoints
    const userUpdate = await User.findOneAndUpdate(
      { firebaseUid: firebaseUid },
      {
        $inc: {
          walletBalance: joyPoints,
          totalPoints: joyPoints
        }
      },
      { new: true }
    );

    console.log('✅ User wallet updated:', userUpdate?.walletBalance);
    console.log('✅ User points updated:', userUpdate?.totalPoints);

    // Create transaction record for product purchase
    if (joyPoints > 0) {
      try {
        await Transaction.create({
          userId: userUpdate?._id || firebaseUid,
          type: 'purchase',
          amount: joyPoints,
          description: `Joy Points earned from product purchase`,
          referenceId: razorpay_payment_id,
          metadata: {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            totalAmount: totalAmount,
            orderCount: orders.length
          },
          balanceAfter: userUpdate?.walletBalance || 0,
          status: 'completed'
        });
        console.log('✅ Transaction record created for product purchase');
      } catch (txError) {
        console.error('❌ Transaction creation error:', txError);
      }
    }

    // Mark coupon as used if promo code exists in order
    if (orders.length > 0 && orders[0].promoCode) {
      try {
        await User.updateOne(
          { firebaseUid: firebaseUid, "redeemedCoupons.code": orders[0].promoCode },
          { $set: { "redeemedCoupons.$.isUsed": true } }
        );
        console.log("✅ Coupon marked as used:", orders[0].promoCode);
      } catch (err) {
        console.error("❌ Failed to mark coupon as used:", err);
      }
    }

    // Send order confirmation email
    try {
      if (orders.length > 0) {
        const firstOrder = orders[0];
        const userEmail = firstOrder.shippingAddress?.email;
        const userName = firstOrder.shippingAddress?.fullName || 'Valued Customer';

        if (userEmail) {
          const orderItems = orders.map((o: any) => ({
            name: o.productName,
            quantity: o.quantity,
            price: o.price
          }));

          console.log('📧 Sending order confirmation email to:', userEmail);
          await sendOrderConfirmationEmail(
            userEmail,
            userName,
            razorpay_order_id,
            totalAmount,
            orderItems
          );
        } else {
          console.log('⚠️ No email found in shipping address, skipping email.');
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError);
    }

    // 🎯 CLEAR THE CART AFTER SUCCESSFUL PAYMENT
    console.log("\n========================================");
    console.log("🧹 ATTEMPTING TO CLEAR CART");
    console.log("========================================");
    // console.log("FirebaseUid:", firebaseUid);

    try {
      // Use the same MongoDB connection as the cart API
      const cartClient = new MongoClient(process.env.MONGODB_URI!);
      await cartClient.connect();

      try {
        const db = cartClient.db("joyjuncture");
        const cartCollection = db.collection("cart");

        // Find all cart items for this user
        const existingItems = await cartCollection.find({ userId: firebaseUid }).toArray();

        console.log("📦 Cart items found:", existingItems.length);

        if (existingItems.length > 0) {
          console.log("📦 Items to delete:");
          existingItems.forEach((item: any, index: number) => {
            console.log(`   ${index + 1}. ${item.productName} (${item.quantity}x)`);
          });
        }

        // Delete all cart items
        const cartDeleteResult = await cartCollection.deleteMany({ userId: firebaseUid });

        console.log("🗑️ Delete result:", {
          acknowledged: cartDeleteResult.acknowledged,
          deletedCount: cartDeleteResult.deletedCount
        });

        // Verify deletion
        const verifyItems = await cartCollection.find({ userId: firebaseUid }).toArray();
        console.log("✅ Remaining items after delete:", verifyItems.length);

        if (verifyItems.length === 0) {
          console.log("🎉 CART SUCCESSFULLY DELETED!");
        } else {
          console.error("❌ CART ITEMS STILL EXIST AFTER DELETE!");
        }
      } finally {
        await cartClient.close();
      }

      console.log("========================================\n");
    } catch (cartError: any) {
      console.error("\n========================================");
      console.error("❌ CART DELETION ERROR");
      console.error("========================================");
      console.error("Error:", cartError.message);
      console.error("Stack:", cartError.stack);
      console.error("========================================\n");
      // Don't fail the payment if cart clearing fails
    }

    return NextResponse.json({
      success: true,
      ordersUpdated: updatedOrders.modifiedCount,
      orderIds: orders.map((o) => o._id.toString()),
      joyPointsEarned: joyPoints,
      cartCleared: true
    });
  } catch (error) {
    console.error('❌ Product payment error:', error);
    throw error;
  }
}