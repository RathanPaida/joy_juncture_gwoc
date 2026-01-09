// import { NextRequest, NextResponse } from 'next/server';
// import crypto from 'crypto';
// import connectDb from '@/lib/mongodb';
// import { Registration, User, Transaction, Event } from '@/models/Event';

// export async function POST(request: NextRequest) {
//   try {
//     await connectDb();
    
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature, notes } = await request.json();
    
//     // Verify signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//       .update(body.toString())
//       .digest('hex');
    
//     if (expectedSignature !== razorpay_signature) {
//       return NextResponse.json(
//         { error: 'Invalid signature' },
//         { status: 400 }
//       );
//     }
    
//     // Create registration
//     const registration = await Registration.create({
//       userId: notes.userId,
//       eventId: notes.eventId,
//       razorpayPaymentId: razorpay_payment_id,
//       amountPaid: notes.amount / 100,
//       coinsEarned: notes.coins,
//       status: 'completed',
//     });
    
//     // Add coins to user
//     await User.findByIdAndUpdate(notes.userId, {
//       $inc: { coins: notes.coins }
//     });
    
//     // Create transaction record
//     await Transaction.create({
//       userId: notes.userId,
//       type: 'credit',
//       amount: notes.coins,
//       description: `Coins earned for event registration`,
//       referenceId: registration._id.toString(),
//     });
    
//     return NextResponse.json({ success: true, registration });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Payment verification failed' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase, getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const db = await getDatabase();
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = await request.json();
    
    console.log('🔍 Verifying Razorpay payment:', razorpay_order_id);
    
    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }
    
    // Find payment record
    const paymentsCollection = db.collection('payments');
    const payment = await paymentsCollection.findOne({ 
      razorpayOrderId: razorpay_order_id 
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }
    
    if (payment.status === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      );
    }
    
    // Update payment status
    await paymentsCollection.updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          status: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          completedAt: new Date()
        }
      }
    );
    
    // Create registration
    const verificationCode = crypto.randomBytes(16).toString('hex');
    const qrData = `${payment.eventId}-${payment.userId}-${verificationCode}`;
    
    const registrationsCollection = db.collection('registrations');
    const registration = {
      eventId: payment.eventId,
      userId: payment.userId,
      userName: payment.userName,
      userEmail: payment.userEmail,
      amount: payment.amount,
      verificationCode,
      qrData,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentStatus: 'completed',
      status: 'confirmed',
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await registrationsCollection.insertOne(registration);
    
    // Decrease available seats
    const eventsCollection = db.collection('events');
    await eventsCollection.updateOne(
      { _id: payment.eventId },
      { $inc: { availableSeats: -1 } }
    );
    
    // Add coins to user (if applicable)
    const event = await eventsCollection.findOne({ _id: payment.eventId });
    if (event && event.coins > 0) {
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { uid: payment.userId },
        { $inc: { totalPoints: event.coins } }
      );
    }
    
    return NextResponse.json({
      success: true,
      registrationId: result.insertedId.toString(),
      verificationCode,
      message: 'Payment verified successfully'
    });
    
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}