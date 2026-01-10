

// app/api/payment/create/route.ts
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { eventId, userId, userName, userEmail } = await request.json();

    console.log('🔍 Creating payment order for:', { eventId, userId });

    // Validate inputs
    if (!eventId || !userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    const db = await getDatabase();

    // Get event details
    const eventsCollection = db.collection('events');
    
    // Convert eventId to ObjectId if it's a string
    let eventObjectId;
    try {
      eventObjectId = typeof eventId === 'string' ? new ObjectId(eventId) : eventId;
    } catch (error) {
      console.error('❌ Invalid eventId format:', eventId);
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    const event = await eventsCollection.findOne({ _id: eventObjectId });

    if (!event) {
      console.error('❌ Event not found:', eventObjectId);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.name);

    // Check available seats
    if (event.availableSeats <= 0) {
      return NextResponse.json(
        { error: 'No seats available' },
        { status: 400 }
      );
    }

    // Check if user already registered
    const registrationsCollection = db.collection('registrations');
    const existingRegistration = await registrationsCollection.findOne({
      eventId: eventObjectId,
      userId: userId,
      paymentStatus: 'completed'
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amount = event.price * 100; // Convert to paise
    const currency = 'INR';

    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId: eventId.toString(),
        userId,
        userName,
        userEmail
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Store order in database
    const ordersCollection = db.collection('orders');
    await ordersCollection.insertOne({
      razorpayOrderId: razorpayOrder.id, // Store Razorpay's order ID
      eventId: eventObjectId, // Store as ObjectId
      userId,
      userName,
      userEmail,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Order saved to database');

    // Return order details to frontend
    return NextResponse.json({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      eventName: event.name
    });

  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}