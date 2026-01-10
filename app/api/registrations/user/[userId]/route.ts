
// // app/api/registrations/user/[userId]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getDatabase, connectToDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// interface RouteContext {
//   params: Promise<{ userId: string }>;
// }

// export async function GET(
//   request: NextRequest,
//   context: RouteContext
// ) {
//   try {
//     // In Next.js 15+, params is a Promise that needs to be awaited
//     const params = await context.params;
//     const userId = params.userId;

//     console.log('🔍 API Route Hit - Full URL:', request.url);
//     console.log('🔍 Params:', params);
//     console.log('🔍 User ID:', userId);

//     if (!userId) {
//       console.error('❌ User ID is missing from params');
//       return NextResponse.json(
//         { success: false, error: 'User ID is required' },
//         { status: 400 }
//       );
//     }

//     await connectToDatabase();
//     const db = await getDatabase();

//     console.log('✅ Database connected');

//     const registrationsCollection = db.collection('registrations');
//     const eventsCollection = db.collection('events');

//     const registrations = await registrationsCollection.find({ 
//       userId,
//       paymentStatus: 'completed'
//     }).sort({ createdAt: -1 }).toArray();

//     console.log(`✅ Found ${registrations.length} registrations for user: ${userId}`);

//     if (registrations.length === 0) {
//       return NextResponse.json({
//         success: true,
//         registrations: []
//       });
//     }

//     const registeredEvents = await Promise.all(
//       registrations.map(async (reg) => {
//         try {
//           let eventId = reg.eventId;
//           if (typeof eventId === 'string') {
//             eventId = new ObjectId(eventId);
//           }

//           const event = await eventsCollection.findOne({ _id: eventId });
//           if (!event) {
//             console.log('⚠️ Event not found for registration:', reg._id);
//             return null;
//           }

//           return {
//             registrationId: reg._id.toString(),
//             registrationDate: reg.createdAt,
//             paymentStatus: reg.paymentStatus,
//             attendanceMarked: reg.attendanceMarked || false,
//             _id: event._id.toString(),
//             name: event.name,
//             description: event.description,
//             detailedDescription: event.detailedDescription || event.description,
//             date: event.date,
//             time: event.time || '',
//             Venue: event.Venue || '',
//             address: event.address || '',
//             price: event.price,
//             coins: event.coins || 0,
//             totalSeats: event.totalSeats,
//             availableSeats: event.availableSeats,
//             collabWith: event.collabWith || '',
//             imageUrl: event.imageUrl || '',
//             isActive: event.isActive !== false
//           };
//         } catch (error) {
//           console.error('Error processing registration:', reg._id, error);
//           return null;
//         }
//       })
//     );

//     const validRegistrations = registeredEvents.filter(reg => reg !== null);

//     console.log(`✅ Returning ${validRegistrations.length} valid registrations`);

//     return NextResponse.json({
//       success: true,
//       registrations: validRegistrations
//     });

//   } catch (error) {
//     console.error('❌ Error fetching user registrations:', error);
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Failed to fetch registrations',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const userId = params.userId;

    console.log('🔍 Fetching user data for:', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ 
      firebaseUid: userId 
    });

    if (!user) {
      console.log('⚠️ User not found, returning defaults');
      return NextResponse.json({
        success: true,
        user: {
          uid: userId,
          walletBalance: 0,
          totalPoints: 0,
          registeredEvents: []
        }
      });
    }

    console.log('✅ User found, wallet balance:', user.walletBalance);

    return NextResponse.json({
      success: true,
      user: {
        uid: userId,
        email: user.email,
        name: user.name,
        walletBalance: user.walletBalance || 0,
        totalPoints: user.totalPoints || 0,
        registeredEvents: user.registeredEvents || [],
        level: user.level || 1,
        streak: user.streak || 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}