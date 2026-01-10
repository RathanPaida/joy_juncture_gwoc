// // app/api/payment/verify/route.ts
// import { NextResponse } from 'next/server';
// import crypto from 'crypto';
// import { getDatabase, connectToDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import connectDb from '@/lib/mongodb';
// import { User, Transaction } from '@/models/User';
// import { Order } from '@/models/Order';
// import { verifyIdToken } from '@/lib/firebase-admin';

// export async function POST(request: Request) {
//   try {
//     // Connect to MongoDB
//     await connectDb();

//     // Verify Firebase token for authentication
//     const authHeader = request.headers.get('Authorization');
//     let firebaseUid: string | null = null;
//     let isAuthenticated = false;

//     if (authHeader && authHeader.startsWith('Bearer ')) {
//       try {
//         const token = authHeader.split('Bearer ')[1];
//         const decodedToken = await verifyIdToken(token);
//         firebaseUid = decodedToken.uid;
//         isAuthenticated = true;
//         console.log('✅ User authenticated:', firebaseUid);
//       } catch (error: any) {
//         console.log('⚠️ Firebase auth failed, proceeding without authentication:', error.message);
//         // Continue without authentication for backward compatibility
//       }
//     } else {
//       return NextResponse.json(
//         { error: 'Unauthorized - No token provided' },
//         { status: 401 }
//       );
//     }

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature
//     } = await request.json();

//     console.log('🔍 Payment verification started');
//     console.log('Order ID:', razorpay_order_id);
//     console.log('Payment ID:', razorpay_payment_id);
//     console.log('Authenticated User:', firebaseUid);

//     // Validate inputs
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return NextResponse.json(
//         { success: false, error: 'Missing payment details' },
//         { status: 400 }
//       );
//     }

//     // Verify Razorpay signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//       .update(body.toString())
//       .digest('hex');
    
//     if (expectedSignature !== razorpay_signature) {
//       console.error('❌ Invalid payment signature');
//       return NextResponse.json(
//         { success: false, error: 'Invalid payment signature' },
//         { status: 400 }
//       );
//     }

//     console.log('✅ Signature verified');

//     // Find specific order by razorpay_order_id
//     const specificOrder = await Order.findOne({ 
//       razorpayOrderId: razorpay_order_id 
//     });

//     if (specificOrder) {
//       console.log('✅ Found specific order:', specificOrder._id);
      
//       // If user is authenticated, verify they own this order
//       if (isAuthenticated && firebaseUid && specificOrder.firebaseUid !== firebaseUid) {
//         console.error('❌ User does not own this order');
//         return NextResponse.json(
//           { success: false, error: 'Unauthorized access to order' },
//           { status: 403 }
//         );
//       }

//       // If no authentication but order has firebaseUid, use it
//       if (!firebaseUid && specificOrder.firebaseUid) {
//         firebaseUid = specificOrder.firebaseUid;
//       }

//       // Check if payment is already completed
//       if (specificOrder.status === 'completed') {
//         console.log('ℹ️ Payment already completed');
//         return NextResponse.json({
//           success: true,
//           message: 'Payment already verified',
//           orderId: specificOrder._id.toString()
//         });
//       }

//       // Update specific order status to completed
//       specificOrder.status = 'completed';
//       specificOrder.paymentId = razorpay_payment_id;
//       specificOrder.updatedAt = new Date();
//       await specificOrder.save();
//       console.log('✅ Specific order status updated to completed');

//       // Process based on order type
//       let result: any = {
//         success: true,
//         orderId: specificOrder._id.toString(),
//         paymentId: razorpay_payment_id
//       };

//       if (specificOrder.type === 'event') {
//         // Event registration payment flow
//         const db = await getDatabase();
//         const eventsCollection = db.collection('events');
//         const registrationsCollection = db.collection('registrations');

//         // Get event details
//         const event = await eventsCollection.findOne({ 
//           _id: new ObjectId(specificOrder.eventId) 
//         });

//         if (!event) {
//           console.error('❌ Event not found:', specificOrder.eventId);
//           return NextResponse.json(
//             { success: false, error: 'Event not found' },
//             { status: 404 }
//           );
//         }

//         console.log('✅ Event found:', event.name);

//         // Check if already registered
//         const existingRegistration = await registrationsCollection.findOne({
//           eventId: new ObjectId(specificOrder.eventId),
//           userId: specificOrder.userId || firebaseUid,
//           paymentStatus: 'completed'
//         });

//         if (existingRegistration) {
//           console.log('ℹ️ User already registered');
//           result.registrationId = existingRegistration._id.toString();
//           result.message = 'Already registered';
//           return NextResponse.json(result);
//         }

//         // Generate verification code
//         const verificationCode = crypto.randomBytes(16).toString('hex');
//         const qrData = `${specificOrder.eventId}-${specificOrder.userId || firebaseUid}-${verificationCode}`;

//         // Create registration record
//         const registration = {
//           eventId: new ObjectId(specificOrder.eventId),
//           userId: specificOrder.userId || firebaseUid,
//           userName: specificOrder.userName,
//           userEmail: specificOrder.userEmail,
//           paymentId: razorpay_payment_id,
//           orderId: razorpay_order_id,
//           amount: specificOrder.amount / 100, // Convert from paise to rupees
//           verificationCode,
//           qrData,
//           paymentStatus: 'completed',
//           status: 'confirmed',
//           coinsAwarded: true,
//           attendanceMarked: false,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };

//         const registrationResult = await registrationsCollection.insertOne(registration);
//         console.log('✅ Registration created:', registrationResult.insertedId);

//         // Update event seats
//         await eventsCollection.updateOne(
//           { _id: new ObjectId(specificOrder.eventId) },
//           { 
//             $inc: { availableSeats: -1 },
//             $set: { updatedAt: new Date() }
//           }
//         );
//         console.log('✅ Event seats updated');

//         // Award coins for event registration
//         const coinsToAdd = event.coins || 0;
        
//         if (firebaseUid && coinsToAdd > 0) {
//           // Get current user wallet balance
//           const currentUser = await User.findOne({ firebaseUid });
          
//           if (currentUser) {
//             const currentBalance = currentUser.walletBalance || 0;
//             const newBalance = currentBalance + coinsToAdd;

//             // Update user with coins and registered event
//             currentUser.walletBalance = newBalance;
//             currentUser.totalPoints = (currentUser.totalPoints || 0) + coinsToAdd;
            
//             if (!currentUser.registeredEvents) {
//               currentUser.registeredEvents = [];
//             }
//             currentUser.registeredEvents.push(new ObjectId(specificOrder.eventId));
            
//             await currentUser.save();
//             console.log(`✅ Added ${coinsToAdd} coins to user`);

//             // Create transaction record
//             try {
//               await Transaction.create({
//                 userId: firebaseUid,
//                 type: 'event',
//                 amount: coinsToAdd,
//                 description: `Coins earned from registering for ${event.name}`,
//                 referenceId: registrationResult.insertedId.toString(),
//                 metadata: {
//                   eventId: specificOrder.eventId,
//                   eventName: event.name,
//                   registrationId: registrationResult.insertedId.toString(),
//                   paymentId: razorpay_payment_id
//                 },
//                 balanceAfter: newBalance,
//                 status: 'completed'
//               });
//               console.log('✅ Transaction record created');
//             } catch (txError) {
//               console.error('❌ Transaction creation error:', txError);
//             }
//           }
//         }

//         result.registrationId = registrationResult.insertedId.toString();
//         result.coinsAwarded = coinsToAdd;
//         result.message = 'Event registration confirmed';

//       } else if (specificOrder.type === 'store' || !specificOrder.type) {
//         // Store purchase flow (default)
//         // Calculate Joy Points (total ÷ 10)
//         const joyPoints = Math.floor(specificOrder.totalAmount / 10);
//         console.log('🎁 Joy points to add:', joyPoints);
        
//         if (firebaseUid && joyPoints > 0) {
//           // Update BOTH walletBalance AND totalPoints
//           const userUpdate = await User.findOneAndUpdate(
//             { firebaseUid },
//             { 
//               $inc: { 
//                 walletBalance: joyPoints,
//                 totalPoints: joyPoints
//               } 
//             },
//             { new: true }
//           );

//           if (userUpdate) {
//             console.log('✅ User wallet updated:', userUpdate.walletBalance);
//             console.log('✅ User points updated:', userUpdate.totalPoints);

//             // Create transaction record for store purchase
//             try {
//               await Transaction.create({
//                 userId: firebaseUid,
//                 type: 'store',
//                 amount: joyPoints,
//                 description: `Joy Points earned from store purchase`,
//                 referenceId: specificOrder._id.toString(),
//                 metadata: {
//                   orderId: specificOrder._id.toString(),
//                   paymentId: razorpay_payment_id,
//                   totalAmount: specificOrder.totalAmount
//                 },
//                 balanceAfter: userUpdate.walletBalance,
//                 status: 'completed'
//               });
//               console.log('✅ Store transaction record created');
//             } catch (txError) {
//               console.error('❌ Transaction creation error:', txError);
//             }
//           }
//         }

//         result.joyPointsEarned = joyPoints;
//         result.message = 'Store purchase completed';
//       }

//       return NextResponse.json(result);
//     } else {
//       // If no specific order found, fall back to batch update for processing orders
//       console.log('ℹ️ No specific order found, checking for processing orders...');
      
//       if (!firebaseUid) {
//         return NextResponse.json(
//           { success: false, error: 'Authentication required for batch processing' },
//           { status: 401 }
//         );
//       }

//       // Update all orders for this user that are processing (within last 10 minutes)
//       const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
//       const updatedOrders = await Order.updateMany(
//         {
//           firebaseUid: firebaseUid,
//           status: 'processing',
//           purchaseDate: { $gte: tenMinutesAgo }
//         },
//         {
//           $set: {
//             status: 'completed',
//             trackingNumber: razorpay_payment_id,
//             paymentId: razorpay_payment_id,
//             updatedAt: new Date()
//           }
//         }
//       );

//       console.log('✅ Orders updated:', updatedOrders.modifiedCount);

//       if (updatedOrders.modifiedCount === 0) {
//         return NextResponse.json(
//           { success: false, error: 'No processing orders found for user' },
//           { status: 404 }
//         );
//       }

//       // Calculate total amount from all updated orders
//       const orders = await Order.find({
//         firebaseUid: firebaseUid,
//         trackingNumber: razorpay_payment_id
//       });

//       const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || order.amount || 0), 0);
//       console.log('💰 Total amount:', totalAmount);

//       // Calculate Joy Points (total ÷ 10)
//       const joyPoints = Math.floor(totalAmount / 10);
//       console.log('🎁 Joy points to add:', joyPoints);
      
//       // Update BOTH walletBalance AND totalPoints
//       const userUpdate = await User.findOneAndUpdate(
//         { firebaseUid: firebaseUid },
//         { 
//           $inc: { 
//             walletBalance: joyPoints,
//             totalPoints: joyPoints
//           } 
//         },
//         { new: true }
//       );

//       console.log('✅ User wallet updated:', userUpdate?.walletBalance);
//       console.log('✅ User points updated:', userUpdate?.totalPoints);

//       // Create transaction records for each order
//       for (const order of orders) {
//         try {
//           await Transaction.create({
//             userId: firebaseUid,
//             type: order.type === 'event' ? 'event' : 'store',
//             amount: joyPoints / orders.length, // Distribute points evenly
//             description: order.type === 'event' 
//               ? `Coins earned from event registration` 
//               : `Joy Points earned from store purchase`,
//             referenceId: order._id.toString(),
//             metadata: {
//               orderId: order._id.toString(),
//               paymentId: razorpay_payment_id,
//               totalAmount: order.totalAmount || order.amount || 0,
//               orderType: order.type || 'store'
//             },
//             balanceAfter: userUpdate?.walletBalance || 0,
//             status: 'completed'
//           });
//         } catch (txError) {
//           console.error('❌ Transaction creation error for order:', order._id, txError);
//         }
//       }

//       return NextResponse.json({ 
//         success: true, 
//         ordersUpdated: updatedOrders.modifiedCount,
//         orderIds: orders.map(o => o._id.toString()),
//         joyPointsEarned: joyPoints,
//         message: 'Batch payment verification completed'
//       });
//     }

//   } catch (error: any) {
//     console.error('❌ Payment verification failed:', error);
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

// app/api/payment/verify/route.ts - UNIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import connectDb from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { User, Transaction } from '@/models/User';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    await connectToDatabase();
    
    // Get payment details from request
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

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('✅ Signature verified');

    // Try to authenticate user (optional for events)
    const authHeader = request.headers.get('Authorization');
    let firebaseUid: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        console.log('✅ User authenticated:', firebaseUid);
      } catch (error: any) {
        console.log('⚠️ Firebase auth failed:', error.message);
      }
    }

    const db = await getDatabase();
    const ordersCollection = db.collection('orders');

    // First, try to find event registration order
    const eventOrder = await ordersCollection.findOne({ 
      razorpayOrderId: razorpay_order_id 
    });

    if (eventOrder) {
      // EVENT REGISTRATION FLOW
      console.log('📅 Processing EVENT registration payment');
      
      const registrationsCollection = db.collection('registrations');
      const eventsCollection = db.collection('events');
      const usersCollection = db.collection('users');

      // Use userId from order
      const userId = eventOrder.userId;

      // Get event details
      const event = await eventsCollection.findOne({ 
        _id: new ObjectId(eventOrder.eventId) 
      });

      if (!event) {
        console.error('❌ Event not found:', eventOrder.eventId);
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        );
      }

      console.log('✅ Event found:', event.name);

      // Check if already registered
      const existingRegistration = await registrationsCollection.findOne({
        eventId: new ObjectId(eventOrder.eventId),
        userId: userId,
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
      const qrData = `${eventOrder.eventId}-${userId}-${verificationCode}`;

      // Create registration record
      const registration = {
        eventId: new ObjectId(eventOrder.eventId),
        userId: userId,
        userName: eventOrder.userName,
        userEmail: eventOrder.userEmail,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: eventOrder.amount / 100,
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
        { _id: new ObjectId(eventOrder.eventId) },
        { 
          $inc: { availableSeats: -1 },
          $set: { updatedAt: new Date() }
        }
      );
      console.log('✅ Event seats updated');

      // Award coins
      const coinsToAdd = event.coins || 0;
      
      if (coinsToAdd > 0) {
        // Get current user
        const currentUser = await usersCollection.findOne({ 
          firebaseUid: userId 
        });

        const currentBalance = currentUser?.walletBalance || 0;
        const newBalance = currentBalance + coinsToAdd;

        // Update user with coins and registered event
        await usersCollection.updateOne(
          { firebaseUid: userId },
          {
            $inc: { 
              walletBalance: coinsToAdd,
              totalPoints: coinsToAdd 
            },
            $addToSet: { registeredEvents: new ObjectId(eventOrder.eventId) },
            $set: { 
              lastActivity: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
        console.log(`✅ Added ${coinsToAdd} coins to user wallet`);

        // Also update using Mongoose for consistency
        try {
          await User.findOneAndUpdate(
            { firebaseUid: userId },
            {
              $inc: { 
                walletBalance: coinsToAdd,
                totalPoints: coinsToAdd 
              }
            }
          );
          console.log('✅ User model updated');
        } catch (e) {
          console.log('⚠️ Mongoose update skipped:', e);
        }

        // Create transaction record
        try {
          await Transaction.create({
            userId: userId,
            type: 'event',
            amount: coinsToAdd,
            description: `Coins earned from registering for ${event.name}`,
            referenceId: registrationResult.insertedId.toString(),
            metadata: {
              eventId: eventOrder.eventId,
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

    } else {
      // STORE ORDER FLOW
      console.log('🛒 Processing STORE order payment');

      if (!firebaseUid) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required for store orders' },
          { status: 401 }
        );
      }

      // Update all processing orders for this user
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const updatedOrders = await Order.updateMany(
        {
          firebaseUid: firebaseUid,
          status: 'processing',
          purchaseDate: { $gte: tenMinutesAgo }
        },
        {
          $set: {
            status: 'completed',
            trackingNumber: razorpay_payment_id,
            paymentId: razorpay_payment_id,
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ Orders updated:', updatedOrders.modifiedCount);

      if (updatedOrders.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'No processing orders found' },
          { status: 404 }
        );
      }

      // Get all updated orders
      const orders = await Order.find({
        firebaseUid: firebaseUid,
        trackingNumber: razorpay_payment_id
      });

      const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      console.log('💰 Total amount:', totalAmount);

      // Calculate Joy Points (total ÷ 10)
      const joyPoints = Math.floor(totalAmount / 10);
      console.log('🎁 Joy points to add:', joyPoints);
      
      // Update user wallet and points
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

      // Create transaction records
      try {
        await Transaction.create({
          userId: firebaseUid,
          type: 'purchase',
          amount: joyPoints,
          description: `Joy Points earned from store purchase`,
          referenceId: orders.map(o => o._id.toString()).join(','),
          metadata: {
            orderIds: orders.map(o => o._id.toString()),
            paymentId: razorpay_payment_id,
            totalAmount: totalAmount
          },
          balanceAfter: userUpdate?.walletBalance || 0,
          status: 'completed'
        });
        console.log('✅ Store transaction record created');
      } catch (txError) {
        console.error('❌ Transaction creation error:', txError);
      }

      return NextResponse.json({ 
        success: true, 
        ordersUpdated: updatedOrders.modifiedCount,
        orderIds: orders.map(o => o._id.toString()),
        joyPointsEarned: joyPoints,
        message: 'Store purchase completed'
      });
    }

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