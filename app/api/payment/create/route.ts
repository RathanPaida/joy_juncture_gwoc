// // app/api/payment/create/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import Razorpay from 'razorpay';
// import connectDb from '@/lib/mongodb';
// import { getDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import { Event, User } from '@/models/Events';

// const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export async function POST(request: NextRequest) {
//   try {
//     await connectDb();

//     const body = await request.json();
//     const { type, eventId, userId, userName, userEmail } = body;

//     console.log('🔍 Creating payment order');
//     console.log('Type:', type);
//     console.log('Event ID:', eventId);
//     console.log('User ID:', userId);

//     // Validate inputs
//     if (!eventId || !userId) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     // Route to appropriate handler based on type
//     if (type === 'event-mongoose') {
//       return await handleMongooseEventPayment(eventId, userId);
//     } else {
//       // Default to collection-based event payment (for backward compatibility)
//       return await handleCollectionEventPayment(
//         eventId,
//         userId,
//         userName,
//         userEmail
//       );
//     }
//   } catch (error) {
//     console.error('❌ Payment creation error:', error);
//     return NextResponse.json(
//       {
//         error: 'Failed to create payment order',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }

// // Handler for Mongoose-based event payment
// async function handleMongooseEventPayment(eventId: string, userId: string) {
//   try {
//     const event = await Event.findById(eventId);
//     const user = await User.findOne({ uid: userId });

//     if (!event || !user) {
//       return NextResponse.json(
//         { error: 'Event or user not found' },
//         { status: 404 }
//       );
//     }

//     console.log('✅ Event found (Mongoose):', event.name);

//     const options = {
//       amount: event.price * 100, // Convert to paise
//       currency: 'INR',
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         eventId: eventId,
//         userId: user._id.toString(),
//         coins: event.coins,
//         type: 'event-mongoose'
//       }
//     };

//     const order = await razorpay.orders.create(options);
//     console.log('✅ Razorpay order created (Mongoose):', order.id);

//     return NextResponse.json({
//       ...order,
//       key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
//       eventName: event.name
//     });
//   } catch (error) {
//     console.error('❌ Mongoose event payment error:', error);
//     throw error;
//   }
// }

// // Handler for collection-based event payment
// async function handleCollectionEventPayment(
//   eventId: string,
//   userId: string,
//   userName?: string,
//   userEmail?: string
// ) {
//   try {
//     // Validate required fields for collection-based approach
//     if (!userName || !userEmail) {
//       return NextResponse.json(
//         { error: 'Missing userName or userEmail for collection-based event' },
//         { status: 400 }
//       );
//     }

//     const db = await getDatabase();
//     const eventsCollection = db.collection('events');

//     // Convert eventId to ObjectId if it's a string
//     let eventObjectId;
//     try {
//       eventObjectId = typeof eventId === 'string' ? new ObjectId(eventId) : eventId;
//     } catch (error) {
//       console.error('❌ Invalid eventId format:', eventId);
//       return NextResponse.json(
//         { error: 'Invalid event ID format' },
//         { status: 400 }
//       );
//     }

//     const event = await eventsCollection.findOne({ _id: eventObjectId });

//     if (!event) {
//       console.error('❌ Event not found:', eventObjectId);
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     console.log('✅ Event found (Collection):', event.name);

//     // Check available seats
//     if (event.availableSeats <= 0) {
//       return NextResponse.json(
//         { error: 'No seats available' },
//         { status: 400 }
//       );
//     }

//     // Check if user already registered
//     const registrationsCollection = db.collection('registrations');
//     const existingRegistration = await registrationsCollection.findOne({
//       eventId: eventObjectId,
//       userId: userId,
//       paymentStatus: 'completed'
//     });

//     if (existingRegistration) {
//       return NextResponse.json(
//         { error: 'You are already registered for this event' },
//         { status: 400 }
//       );
//     }

//     // Create Razorpay order
//     const amount = event.price * 100; // Convert to paise
//     const currency = 'INR';

//     const options = {
//       amount,
//       currency,
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         eventId: eventId.toString(),
//         userId,
//         userName,
//         userEmail,
//         type: 'event-collection'
//       }
//     };

//     const razorpayOrder = await razorpay.orders.create(options);
//     console.log('✅ Razorpay order created (Collection):', razorpayOrder.id);

//     // Store order in database
//     const ordersCollection = db.collection('orders');
//     await ordersCollection.insertOne({
//       razorpayOrderId: razorpayOrder.id, // Store Razorpay's order ID
//       eventId: eventObjectId, // Store as ObjectId
//       userId,
//       userName,
//       userEmail,
//       amount,
//       currency,
//       status: 'pending',
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });

//     console.log('✅ Order saved to database');

//     // Return order details to frontend
//     return NextResponse.json({
//       key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//       orderId: razorpayOrder.id,
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//       eventName: event.name
//     });
//   } catch (error) {
//     console.error('❌ Collection event payment error:', error);
//     throw error;
//   }
// }

// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDb from '@/lib/mongodb';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Event, User } from '@/models/Events';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    await connectDb();

    const body = await request.json();
    const { type, eventId, userId, userName, userEmail } = body;

    console.log('🔍 Creating payment order');
    console.log('Type:', type);
    console.log('Event ID:', eventId);
    console.log('User ID:', userId);
    console.log('Timestamp:', new Date().toISOString());

    // Validate inputs
    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Route to appropriate handler based on type
    if (type === 'event-mongoose') {
      return await handleMongooseEventPayment(eventId, userId);
    } else {
      // Default to collection-based event payment (for backward compatibility)
      return await handleCollectionEventPayment(
        eventId,
        userId,
        userName,
        userEmail
      );
    }
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

// Handler for Mongoose-based event payment
async function handleMongooseEventPayment(eventId: string, userId: string) {
  try {
    const event = await Event.findById(eventId);
    const user = await User.findOne({ uid: userId });

    if (!event || !user) {
      return NextResponse.json(
        { error: 'Event or user not found' },
        { status: 404 }
      );
    }

    console.log('✅ Event found (Mongoose):', event.name);

    const options = {
      amount: event.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId: eventId,
        userId: user._id.toString(),
        coins: event.coins,
        type: 'event-mongoose'
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created (Mongoose):', order.id);

    return NextResponse.json({
      ...order,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      eventName: event.name
    });
  } catch (error) {
    console.error('❌ Mongoose event payment error:', error);
    throw error;
  }
}

// Handler for collection-based event payment
async function handleCollectionEventPayment(
  eventId: string,
  userId: string,
  userName?: string,
  userEmail?: string
) {
  try {
    // Validate required fields for collection-based approach
    if (!userName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing userName or userEmail for collection-based event' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    const ordersCollection = db.collection('orders');

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

    console.log('✅ Event found (Collection):', {
      name: event.name,
      price: event.price,
      availableSeats: event.availableSeats
    });

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
      console.log('⚠️ User already registered');
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amount = event.price * 100; // Convert to paise
    const currency = 'INR';
    const receipt = `evt_${eventId}_${userId}_${Date.now()}`;

    const options = {
      amount,
      currency,
      receipt,
      notes: {
        eventId: eventId.toString(),
        userId,
        userName,
        userEmail,
        type: 'event-collection'
      }
    };

    console.log('🔄 Creating Razorpay order with options:', {
      amount,
      currency,
      receipt,
      eventName: event.name
    });

    const razorpayOrder = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });

    // Store order in database with detailed logging
    const orderDocument = {
      razorpayOrderId: razorpayOrder.id,
      eventId: eventObjectId,
      userId,
      userName,
      userEmail,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Saving order to database:', {
      razorpayOrderId: orderDocument.razorpayOrderId,
      eventId: orderDocument.eventId.toString(),
      userId: orderDocument.userId
    });

    const insertResult = await ordersCollection.insertOne(orderDocument);

    console.log('✅ Order saved to database:', {
      insertedId: insertResult.insertedId,
      acknowledged: insertResult.acknowledged
    });

    // Verify the order was actually saved
    const verifyOrder = await ordersCollection.findOne({
      razorpayOrderId: razorpayOrder.id
    });

    if (verifyOrder) {
      console.log('✅ Order verification successful:', {
        _id: verifyOrder._id,
        razorpayOrderId: verifyOrder.razorpayOrderId
      });
    } else {
      console.error('⚠️ Order not found immediately after insert!');
    }

    // Return order details to frontend
    return NextResponse.json({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      eventName: event.name,
      success: true
    });
  } catch (error) {
    console.error('❌ Collection event payment error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}