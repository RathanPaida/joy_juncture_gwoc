// import { NextRequest, NextResponse } from 'next/server';
// import Razorpay from 'razorpay';
// import connectDb from '@/lib/mongodb';
// import { Event, User } from '@/models/Event';

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export async function POST(request: NextRequest) {
//   try {
//     await connectDb();
    
//     const { eventId, userId } = await request.json();
    
//     const event = await Event.findById(eventId);
//     const user = await User.findOne({ uid: userId });
    
//     if (!event || !user) {
//       return NextResponse.json(
//         { error: 'Event or user not found' },
//         { status: 404 }
//       );
//     }
    
//     const options = {
//       amount: event.price * 100, // Convert to paise
//       currency: 'INR',
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         eventId: eventId,
//         userId: user._id.toString(),
//         coins: event.coins,
//       },
//     };
    
//     const order = await razorpay.orders.create(options);
    
//     return NextResponse.json(order);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to create payment' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectToDatabase, getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const db = await getDatabase();
    
    const { eventId, userId, userName, userEmail } = await request.json();
    
    console.log('💳 Creating Razorpay order for:', { eventId, userId });
    
    // Get event details
    const eventsCollection = db.collection('events');
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    if (event.availableSeats <= 0) {
      return NextResponse.json(
        { error: 'No seats available' },
        { status: 400 }
      );
    }
    
    // Get user details
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ uid: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Create Razorpay order
    const options = {
      amount: event.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId: eventId,
        userId: userId,
        userName: userName || user.name,
        userEmail: userEmail || user.email,
        coins: event.coins,
      },
    };
    
    const order = await razorpay.orders.create(options);
    
    // Store payment record in database
    const paymentsCollection = db.collection('payments');
    await paymentsCollection.insertOne({
      orderId: order.id,
      eventId: new ObjectId(eventId),
      userId,
      userName: userName || user.name,
      userEmail: userEmail || user.email,
      amount: event.price,
      currency: 'INR',
      status: 'created',
      razorpayOrderId: order.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      eventName: event.name,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}