// app/api/payment/verify/route.ts - COMPLETE WITH CART CLEARING
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDb from '@/lib/mongodb';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId, MongoClient } from 'mongodb';
import { Order } from '@/models/Order';
import { User, Transaction } from '@/models/User';
import { verifyIdToken } from '@/lib/firebase-admin';
// Unified Email Imports: prioritizing specific templates, falling back to generic
import { sendEventRegistrationEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { sendEmail } from '@/lib/mail';

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
      if (sendEventRegistrationEmail) {
        await sendEventRegistrationEmail(
          order.userEmail,
          order.userName,
          event.name,
          event.date || new Date(),
          event.location || 'Online'
        );
      } else {
        // Fallback or log if function missing
        console.warn("sendEventRegistrationEmail function not available");
      }
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
    console.log('👤 Verify Payment for User:', firebaseUid);

    // 1. Update orders directly using the unique Razorpay Order ID
    const updatedOrders = await Order.updateMany(
      {
        razorpayOrderId: razorpay_order_id,
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

    console.log(`✅ Orders updated via ID ${razorpay_order_id}:`, updatedOrders.modifiedCount);

    // 2. Fetch the orders to calculate totals
    let orders = await Order.find({
      razorpayOrderId: razorpay_order_id
    }).lean();

    // SELF-HEALING FALLBACK: If not found, fetch from Razorpay API to find the linked Mongo IDs
    if (orders.length === 0) {
      console.warn('⚠️ Orders not found by Razorpay ID. Attempting self-healing via Razorpay API...');
      try {
        const Razorpay = require("razorpay");
        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const rzpOrder = await instance.orders.fetch(razorpay_order_id);

        if (rzpOrder && rzpOrder.notes && rzpOrder.notes.orderIds) {
          const mongoOrderIds = rzpOrder.notes.orderIds.split(',');
          // Find these orders
          orders = await Order.find({ _id: { $in: mongoOrderIds } }).lean();

          if (orders.length > 0) {
            // HEAL: Update them with the missing ID
            await Order.updateMany(
              { _id: { $in: mongoOrderIds } },
              { $set: { razorpayOrderId: razorpay_order_id } }
            );
            console.log('✅ Self-healing complete: Linked Razorpay ID to orders.');
          }
        }
      } catch (fallbackError) {
        console.error('❌ Self-healing failed:', fallbackError);
      }
    }

    if (orders.length === 0) {
      throw new Error("No orders found for this payment ID. Payment verification failed logic.");
    }

    const totalAmount = orders.reduce(
      (sum: any, order: any) => sum + (order.totalAmount || 0),
      0
    );

    // 3. Calculate Joy Points (total ÷ 10)
    const joyPoints = Math.floor(totalAmount / 10);

    // 4. Update BOTH walletBalance AND totalPoints
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
      } catch (err) {
        console.error("❌ Failed to mark coupon as used:", err);
      }
    }

    // Send Order Confirmation Email
    const user = await User.findOne({ firebaseUid: firebaseUid });
    const userEmail = user?.email; // Keep single declaration

    // Refetch orders to be absolutely sure we have the latest data for email
    let emailOrders = orders;
    let emailTotal = totalAmount;

    // ... (Your existing fallback logic for emailOrders can remain or be simplified)

    if (userEmail) {
      const orderItems = emailOrders.map((o: any) => ({
        name: o.productName,
        quantity: o.quantity,
        price: o.price
      }));

      // Use dedicated template if available
      if (sendOrderConfirmationEmail) {
        await sendOrderConfirmationEmail(
          userEmail,
          user.name || 'Valued Customer',
          razorpay_order_id,
          emailTotal,
          orderItems
        );
      } else if (sendEmail) {
        // Fallback to generic HTML email 
        const orderListHtml = emailOrders.map((o: any) => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${o.productName}</strong> - Qty: ${o.quantity} - ₹${o.totalAmount}
            </div>
          `).join('');

        await sendEmail({
          to: userEmail,
          subject: `Order Confirmed - Joy Juncture`,
          html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #FF6B35;">Order Received!</h1>
                <p>Hi ${user.name},</p>
                <p>Thank you for your purchase. We've received your order.</p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                   <h3>Order Summary</h3>
                   ${orderListHtml}
                   <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
                   <p><strong>Total Paid:</strong> ₹${emailTotal}</p>
                   <p><strong>Joy Points Earned:</strong> ${Math.floor(emailTotal / 10)}</p>
                </div>
                <p>We'll notify you when it ships!</p>
                <p>- Team Joy Juncture</p>
              </div>
            `
        });
      }
    }

    // 🎯 CLEAR THE CART
    try {
      const cartClient = new MongoClient(process.env.MONGODB_URI!);
      await cartClient.connect();
      try {
        const db = cartClient.db("joyjuncture");
        const cartCollection = db.collection("cart");
        await cartCollection.deleteMany({ userId: firebaseUid });
      } finally {
        await cartClient.close();
      }
    } catch (cartError) {
      console.error("Cart deletion error:", cartError);
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