// // // import { NextRequest, NextResponse } from 'next/server';
// // // import crypto from 'crypto';
// // // import connectDb from '@/lib/mongodb';
// // // import { Registration, User, Transaction, Event } from '@/models/Event';

// // // export async function POST(request: NextRequest) {
// // //   try {
// // //     await connectDb();
    
// // //     const { razorpay_payment_id, razorpay_order_id, razorpay_signature, notes } = await request.json();
    
// // //     // Verify signature
// // //     const body = razorpay_order_id + "|" + razorpay_payment_id;
// // //     const expectedSignature = crypto
// // //       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
// // //       .update(body.toString())
// // //       .digest('hex');
    
// // //     if (expectedSignature !== razorpay_signature) {
// // //       return NextResponse.json(
// // //         { error: 'Invalid signature' },
// // //         { status: 400 }
// // //       );
// // //     }
    
// // //     // Create registration
// // //     const registration = await Registration.create({
// // //       userId: notes.userId,
// // //       eventId: notes.eventId,
// // //       razorpayPaymentId: razorpay_payment_id,
// // //       amountPaid: notes.amount / 100,
// // //       coinsEarned: notes.coins,
// // //       status: 'completed',
// // //     });
    
// // //     // Add coins to user
// // //     await User.findByIdAndUpdate(notes.userId, {
// // //       $inc: { coins: notes.coins }
// // //     });
    
// // //     // Create transaction record
// // //     await Transaction.create({
// // //       userId: notes.userId,
// // //       type: 'credit',
// // //       amount: notes.coins,
// // //       description: `Coins earned for event registration`,
// // //       referenceId: registration._id.toString(),
// // //     });
    
// // //     return NextResponse.json({ success: true, registration });
// // //   } catch (error) {
// // //     return NextResponse.json(
// // //       { error: 'Payment verification failed' },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // import { NextRequest, NextResponse } from 'next/server';
// // import crypto from 'crypto';
// // import { connectToDatabase, getDatabase } from '@/lib/mongodb';
// // import { ObjectId } from 'mongodb';

// // export async function POST(request: NextRequest) {
// //   try {
// //     await connectToDatabase();
// //     const db = await getDatabase();
    
// //     const { 
// //       razorpay_order_id, 
// //       razorpay_payment_id, 
// //       razorpay_signature,
// //       orderId 
// //     } = await request.json();
    
// //     console.log('🔍 Verifying Razorpay payment:', razorpay_order_id);
    
// //     // Verify signature
// //     const text = `${razorpay_order_id}|${razorpay_payment_id}`;
// //     const expectedSignature = crypto
// //       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
// //       .update(text)
// //       .digest('hex');
    
// //     if (expectedSignature !== razorpay_signature) {
// //       return NextResponse.json(
// //         { error: 'Invalid payment signature' },
// //         { status: 400 }
// //       );
// //     }
    
// //     // Find payment record
// //     const paymentsCollection = db.collection('payments');
// //     const payment = await paymentsCollection.findOne({ 
// //       razorpayOrderId: razorpay_order_id 
// //     });
    
// //     if (!payment) {
// //       return NextResponse.json(
// //         { error: 'Payment record not found' },
// //         { status: 404 }
// //       );
// //     }
    
// //     if (payment.status === 'completed') {
// //       return NextResponse.json(
// //         { error: 'Payment already completed' },
// //         { status: 400 }
// //       );
// //     }
    
// //     // Update payment status
// //     await paymentsCollection.updateOne(
// //       { razorpayOrderId: razorpay_order_id },
// //       {
// //         $set: {
// //           status: 'completed',
// //           razorpayPaymentId: razorpay_payment_id,
// //           razorpaySignature: razorpay_signature,
// //           completedAt: new Date()
// //         }
// //       }
// //     );
    
// //     // Create registration
// //     const verificationCode = crypto.randomBytes(16).toString('hex');
// //     const qrData = `${payment.eventId}-${payment.userId}-${verificationCode}`;
    
// //     const registrationsCollection = db.collection('registrations');
// //     const registration = {
// //       eventId: payment.eventId,
// //       userId: payment.userId,
// //       userName: payment.userName,
// //       userEmail: payment.userEmail,
// //       amount: payment.amount,
// //       verificationCode,
// //       qrData,
// //       orderId: razorpay_order_id,
// //       paymentId: razorpay_payment_id,
// //       paymentStatus: 'completed',
// //       status: 'confirmed',
// //       verified: false,
// //       createdAt: new Date(),
// //       updatedAt: new Date()
// //     };
    
// //     const result = await registrationsCollection.insertOne(registration);
    
// //     // Decrease available seats
// //     const eventsCollection = db.collection('events');
// //     await eventsCollection.updateOne(
// //       { _id: payment.eventId },
// //       { $inc: { availableSeats: -1 } }
// //     );
    
// //     // Add coins to user (if applicable)
// //     const event = await eventsCollection.findOne({ _id: payment.eventId });
// //     if (event && event.coins > 0) {
// //       const usersCollection = db.collection('users');
// //       await usersCollection.updateOne(
// //         { uid: payment.userId },
// //         { $inc: { totalPoints: event.coins } }
// //       );
// //     }
    
// //     return NextResponse.json({
// //       success: true,
// //       registrationId: result.insertedId.toString(),
// //       verificationCode,
// //       message: 'Payment verified successfully'
// //     });
    
// //   } catch (error) {
// //     console.error('❌ Payment verification error:', error);
// //     return NextResponse.json(
// //       { error: 'Payment verification failed' },
// //       { status: 500 }
// //     );
// //   }
// // }


// import { NextRequest, NextResponse } from 'next/server';
// import crypto from 'crypto';
// import { connectToDatabase, getDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// export async function POST(request: NextRequest) {
//   try {
//     await connectToDatabase();
//     const db = await getDatabase();
    
//     const { 
//       razorpay_order_id, 
//       razorpay_payment_id, 
//       razorpay_signature 
//     } = await request.json();
    
//     console.log('🔍 Verifying Razorpay payment:', razorpay_order_id);

//     // Validation
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return NextResponse.json(
//         { 
//           success: false,
//           error: 'Missing payment verification details' 
//         },
//         { status: 400 }
//       );
//     }
    
//     // Verify signature
//     const text = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//       .update(text)
//       .digest('hex');
    
//     if (expectedSignature !== razorpay_signature) {
//       console.error('❌ Invalid payment signature');
//       return NextResponse.json(
//         { 
//           success: false,
//           error: 'Invalid payment signature' 
//         },
//         { status: 400 }
//       );
//     }
    
//     // Find payment record
//     const paymentsCollection = db.collection('payments');
//     const payment = await paymentsCollection.findOne({ 
//       razorpayOrderId: razorpay_order_id 
//     });
    
//     if (!payment) {
//       return NextResponse.json(
//         { 
//           success: false,
//           error: 'Payment record not found' 
//         },
//         { status: 404 }
//       );
//     }
    
//     if (payment.status === 'completed') {
//       return NextResponse.json(
//         { 
//           success: false,
//           error: 'Payment already completed' 
//         },
//         { status: 400 }
//       );
//     }
    
//     // Update payment status
//     await paymentsCollection.updateOne(
//       { razorpayOrderId: razorpay_order_id },
//       {
//         $set: {
//           status: 'completed',
//           razorpayPaymentId: razorpay_payment_id,
//           razorpaySignature: razorpay_signature,
//           completedAt: new Date()
//         }
//       }
//     );
    
//     // Create registration
//     const verificationCode = crypto.randomBytes(16).toString('hex');
//     const qrData = `${payment.eventId}-${payment.userId}-${verificationCode}`;
    
//     const registrationsCollection = db.collection('registrations');
//     const registration = {
//       eventId: payment.eventId,
//       userId: payment.userId,
//       userName: payment.userName,
//       userEmail: payment.userEmail,
//       amount: payment.amount,
//       verificationCode,
//       qrData,
//       orderId: razorpay_order_id,
//       paymentId: razorpay_payment_id,
//       paymentStatus: 'completed',
//       status: 'confirmed',
//       verified: false,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
    
//     const result = await registrationsCollection.insertOne(registration);
    
//     console.log('✅ Registration created:', result.insertedId);
    
//     // Decrease available seats
//     const eventsCollection = db.collection('events');
//     const updateResult = await eventsCollection.updateOne(
//       { _id: payment.eventId },
//       { $inc: { availableSeats: -1 } }
//     );
    
//     console.log('✅ Seats updated:', updateResult.modifiedCount);
    
//     // Add coins to user (if applicable)
//     const event = await eventsCollection.findOne({ _id: payment.eventId });
//     if (event && event.coins > 0) {
//       const usersCollection = db.collection('users');
//       await usersCollection.updateOne(
//         { uid: payment.userId },
//         { $inc: { totalPoints: event.coins } }
//       );
//       console.log(`✅ Added ${event.coins} coins to user`);
//     }
    
//     return NextResponse.json({
//       success: true,
//       registrationId: result.insertedId.toString(),
//       verificationCode,
//       orderId: razorpay_order_id,
//       paymentId: razorpay_payment_id,
//       message: 'Payment verified successfully'
//     });
    
//   } catch (error: any) {
//     console.error('❌ Payment verification error:', error);
//     return NextResponse.json(
//       { 
//         success: false,
//         error: 'Payment verification failed',
//         details: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/payment/verify/route.ts
// app/api/payment/verify/route.ts
// import { NextResponse } from 'next/server';
// // import crypto from 'crypto';
// import { getDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import { connectToDatabase } from '@/lib/mongodb';
// import mongoose from 'mongoose';
// import { User, Transaction } from '@/models/User';

// export async function POST(request: Request) {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       // razorpay_signature,
//       orderId
//     } = await request.json();

//     // Verify signature
//     // const generatedSignature = crypto
//     //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//     //   .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//     //   .digest('hex');

//     // if (generatedSignature !== razorpay_signature) {
//     //   return NextResponse.json(
//     //     { success: false, error: 'Invalid payment signature' },
//     //     { status: 400 }
//     //   );
//     // }

//     // Connect to database
//     const db = await getDatabase();
//     await connectToDatabase();

//     const ordersCollection = db.collection('orders');
//     const registrationsCollection = db.collection('registrations');
//     const eventsCollection = db.collection('events');
//     const usersCollection = db.collection('users');

//     // Get order details
//     const order = await ordersCollection.findOne({
//       razorpayOrderId: razorpay_order_id
//     });

//     if (!order) {
//       return NextResponse.json(
//         { success: false, error: 'Order not found' },
//         { status: 404 }
//       );
//     }

//     // Convert eventId to ObjectId - handle both string and ObjectId
//     let eventId;
//     try {
//       // Try to parse as ObjectId if it's not already one
//       eventId = order.eventId instanceof ObjectId ? 
//         order.eventId : 
//         new ObjectId(order.eventId);
//     } catch (error) {
//       return NextResponse.json(
//         { success: false, error: 'Invalid event ID format' },
//         { status: 400 }
//       );
//     }

//     // Get event details
//     const event = await eventsCollection.findOne({ 
//       _id: eventId 
//     });

//     if (!event) {
//       return NextResponse.json(
//         { success: false, error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     // Rest of your existing code continues here...
//     // Check if already registered
//     const existingRegistration = await registrationsCollection.findOne({
//       eventId: eventId,  // Use the converted eventId
//       userId: order.userId,
//       paymentStatus: 'completed'
//     });


//     // // Generate verification code
//     // const verificationCode = crypto.randomBytes(16).toString('hex');
//     // const qrData = `${order.eventId}-${order.userId}-${verificationCode}`;

//     // Create registration record
//     const registration = {
//       eventId: new ObjectId(order.eventId),
//       userId: order.userId,
//       userName: order.userName,
//       userEmail: order.userEmail,
//       paymentId: razorpay_payment_id,
//       orderId: razorpay_order_id,
//       amount: order.amount / 100, // Convert from paise to rupees
//       // verificationCode,
//       // qrData,
//       paymentStatus: 'completed',
//       status: 'confirmed',
//       coinsAwarded: true, // Mark coins as awarded
//       attendanceMarked: false,
//       createdAt: new Date(),
//       updatedAt: new Date()
     
//     };

//     const registrationResult = await registrationsCollection.insertOne(registration);

//     // Update event seats
//     await eventsCollection.updateOne(
//       { _id: new ObjectId(order.eventId) },
//       { 
//         $inc: { availableSeats: -1 },
//         $set: { updatedAt: new Date() }
//       }
//     );

//     // Update user: Add coins and register event
//     const coinsToAdd = event.coins || 0;
    
//     // Get current user wallet balance
//     const currentUser = await usersCollection.findOne({ 
//       firebaseUid: order.userId 
//     });

//     const currentBalance = currentUser?.walletBalance || 0;
//     const newBalance = currentBalance + coinsToAdd;

//     // Update user with coins and registered event
//     await usersCollection.updateOne(
//       { firebaseUid: order.userId },
//       {
//         $inc: { walletBalance: coinsToAdd },
//         $addToSet: { registeredEvents: new ObjectId(order.eventId) },
//         $set: { 
//           lastActivity: new Date(),
//           updatedAt: new Date()
//         }
//       },
//       { upsert: true }
//     );

//     // Create transaction record using Mongoose model
//     try {
//       await Transaction.create({
//         userId: order.userId,
//         type: 'event',
//         amount: coinsToAdd,
//         description: `Coins earned from registering for ${event.name}`,
//         referenceId: registrationResult.insertedId.toString(),
//         metadata: {
//           eventId: order.eventId,
//           eventName: event.name,
//           registrationId: registrationResult.insertedId.toString(),
//           paymentId: razorpay_payment_id
//         },
//         balanceAfter: newBalance,
//         status: 'completed'
//       });
//     } catch (txError) {
//       console.error('❌ Transaction creation error:', txError);
//       // Continue even if transaction logging fails
//     }

//     // Update order status
//     await ordersCollection.updateOne(
//       { orderId },
//       { 
//         $set: { 
//           status: 'completed',
//           paymentId: razorpay_payment_id,
//           updatedAt: new Date()
//         } 
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       registrationId: registrationResult.insertedId.toString(),
//       coinsAwarded: coinsToAdd,
//       message: 'Payment verified and registration confirmed'
      
//     });

//   } catch (error) {
//     console.error('❌ Payment verification error:', error);
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Payment verification failed',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/payment/verify/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Transaction } from '@/models/User';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = await request.json();

    console.log('🔍 Payment verification started');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
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

    // Connect to database
    await connectToDatabase();
    const db = await getDatabase();

    const ordersCollection = db.collection('orders');
    const registrationsCollection = db.collection('registrations');
    const eventsCollection = db.collection('events');
    const usersCollection = db.collection('users');

    // Find order by razorpay_order_id
    const order = await ordersCollection.findOne({ 
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
        $inc: { walletBalance: coinsToAdd },
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

    return NextResponse.json({
      success: true,
      registrationId: registrationResult.insertedId.toString(),
      coinsAwarded: coinsToAdd,
      message: 'Payment verified and registration confirmed'
    });

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