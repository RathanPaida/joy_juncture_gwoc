// import { NextResponse } from 'next/server';
// import { getDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// export async function GET(
//   request: Request,
//   context: { params: Promise<{ userId: string }> }
// ) {
//   try {
//     const { userId } = await context.params;
//     const { searchParams } = new URL(request.url);
//     const eventId = searchParams.get('eventId');

//     if (!eventId) {
//       return NextResponse.json(
//         { error: 'Event ID required' },
//         { status: 400}
//     );
//     }
//     const db = await getDatabase();
// const registrationsCollection = db.collection('registrations');

// const registration = await registrationsCollection.findOne({
//   eventId: new ObjectId(eventId),
//   userId
// });

// if (!registration) {
//   return NextResponse.json({ registration: null });
// }

// return NextResponse.json({
//   registration: {
//     ...registration,
//     _id: registration._id.toString(),
//     eventId: registration.eventId.toString()
//   }
// });
// } catch (error) {
// console.error('❌ Get registration error:', error);
// return NextResponse.json(
// { error: 'Failed to fetch registration' },
// { status: 500 }
// );
// }
// }


// // =============================================================================
// // FILE 1: app/api/registrations/check/route.ts
// // Create this file to fix the first 404 error
// // =============================================================================

// // import { NextRequest, NextResponse } from 'next/server';
// // import { connectToDatabase, getDatabase } from '@/lib/mongodb';
// // import { ObjectId } from 'mongodb';

// // export async function GET(request: NextRequest) {
// //   try {
// //     const { searchParams } = new URL(request.url);
// //     const eventId = searchParams.get('eventId');
// //     const userId = searchParams.get('userId');

// //     if (!eventId || !userId) {
// //       return NextResponse.json(
// //         { error: 'Missing eventId or userId' },
// //         { status: 400 }
// //       );
// //     }

// //     await connectToDatabase();
// //     const db = await getDatabase();
    
// //     const registrationsCollection = db.collection('registrations');
    
// //     // Check if user is already registered for this event
// //     const existingRegistration = await registrationsCollection.findOne({
// //       eventId: new ObjectId(eventId),
// //       userId: userId,
// //       status: { $in: ['confirmed', 'pending'] }
// //     });

// //     return NextResponse.json({
// //       isRegistered: !!existingRegistration,
// //       registration: existingRegistration || null
// //     });

// //   } catch (error: any) {
// //     console.error('❌ Check registration error:', error);
// //     return NextResponse.json(
// //       { error: 'Failed to check registration', details: error.message },
// //       { status: 500 }
// //     );
// //   }
// // }

// // app/api/registrations/user/[userId]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import connectDB from '@/lib/mongodb';
// import Registration from '@/models/Registration';
// import {Event} from '@/models/Event';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { userId: string } }
// ) {
//   try {
//     await connectDB();

//     const userId = params.userId;

//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: 'User ID is required' },
//         { status: 400 }
//       );
//     }

//     // Find all registrations for this user
//     const registrations = await Registration.find({ 
//       userId,
//       paymentStatus: 'completed'
//     })
//     .populate('eventId')
//     .sort({ createdAt: -1 }) ;

//     // Transform the data to include event details
//     const registeredEvents = registrations
//       .filter(reg => reg.eventId) // Filter out any registrations with deleted events
//       .map(reg => {
//         const event = reg.eventId as any;
//         return {
//           registrationId: reg._id.toString(),
//           registrationDate: reg.createdAt,
//           paymentStatus: reg.paymentStatus,
//           attendanceMarked: reg.attendanceMarked,
//           // Event details
//           _id: event._id.toString(),
//           name: event.name,
//           description: event.description,
//           detailedDescription: event.detailedDescription,
//           date: event.date,
//           time: event.time,
//           venue: event.venue,
//           address: event.address,
//           price: event.price,
//           coins: event.coins,
//           totalSeats: event.totalSeats,
//           availableSeats: event.availableSeats,
//           registrationLink: event.registrationLink,
//           collabWith: event.collabWith,
//           imageUrl: event.imageUrl,
//           isActive: event.isActive
//         };
//       });

//     return NextResponse.json({
//       success: true,
//       registrations: registeredEvents
//     });

//   } catch (error) {
//     console.error('Error fetching user registrations:', error);
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

// // app/api/registrations/user/[userId]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getDatabase, connectToDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { userId: string } }
// ) {
//   try {
//     await connectToDatabase();
//     const db = await getDatabase();

//     const userId = params.userId;

//     console.log('🔍 Fetching registrations for user:', userId);

//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: 'User ID is required' },
//         { status: 400 }
//       );
//     }

//     const registrationsCollection = db.collection('registrations');
//     const eventsCollection = db.collection('events');

//     // Find all registrations for this user
//     const registrations = await registrationsCollection.find({ 
//       userId,
//       paymentStatus: 'completed'
//     }).sort({ createdAt: -1 }).toArray();

//     console.log(`✅ Found ${registrations.length} registrations`);

//     // Fetch event details for each registration
//     const registeredEvents = await Promise.all(
//       registrations.map(async (reg) => {
//         const event = await eventsCollection.findOne({ 
//           _id: reg.eventId 
//         });

//         if (!event) {
//           console.log('⚠️ Event not found for registration:', reg._id);
//           return null;
//         }

//         return {
//           registrationId: reg._id.toString(),
//           registrationDate: reg.createdAt,
//           paymentStatus: reg.paymentStatus,
//           attendanceMarked: reg.attendanceMarked || false,
//           // Event details
//           _id: event._id.toString(),
//           name: event.name,
//           description: event.description,
//           detailedDescription: event.detailedDescription,
//           date: event.date,
//           time: event.time,
//           venue: event.venue,
//           address: event.address,
//           price: event.price,
//           coins: event.coins,
//           totalSeats: event.totalSeats,
//           availableSeats: event.availableSeats,
//           registrationLink: event.registrationLink,
//           collabWith: event.collabWith,
//           imageUrl: event.imageUrl,
//           isActive: event.isActive
//         };
//       })
//     );

//     // Filter out null values (deleted events)
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

// app/api/registrations/user/[userId]/route.ts
// app/api/registrations/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const params = await context.params;
    const userId = params.userId;

    console.log('🔍 API Route Hit - Full URL:', request.url);
    console.log('🔍 Params:', params);
    console.log('🔍 User ID:', userId);

    if (!userId) {
      console.error('❌ User ID is missing from params');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const db = await getDatabase();

    console.log('✅ Database connected');

    const registrationsCollection = db.collection('registrations');
    const eventsCollection = db.collection('events');

    const registrations = await registrationsCollection.find({ 
      userId,
      paymentStatus: 'completed'
    }).sort({ createdAt: -1 }).toArray();

    console.log(`✅ Found ${registrations.length} registrations for user: ${userId}`);

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        registrations: []
      });
    }

    const registeredEvents = await Promise.all(
      registrations.map(async (reg) => {
        try {
          let eventId = reg.eventId;
          if (typeof eventId === 'string') {
            eventId = new ObjectId(eventId);
          }

          const event = await eventsCollection.findOne({ _id: eventId });
          if (!event) {
            console.log('⚠️ Event not found for registration:', reg._id);
            return null;
          }

          return {
            registrationId: reg._id.toString(),
            registrationDate: reg.createdAt,
            paymentStatus: reg.paymentStatus,
            attendanceMarked: reg.attendanceMarked || false,
            _id: event._id.toString(),
            name: event.name,
            description: event.description,
            detailedDescription: event.detailedDescription || event.description,
            date: event.date,
            time: event.time || '',
            venue: event.venue || '',
            address: event.address || '',
            price: event.price,
            coins: event.coins || 0,
            totalSeats: event.totalSeats,
            availableSeats: event.availableSeats,
            registrationLink: event.registrationLink || '',
            collabWith: event.collabWith || '',
            imageUrl: event.imageUrl || '',
            isActive: event.isActive !== false
          };
        } catch (error) {
          console.error('Error processing registration:', reg._id, error);
          return null;
        }
      })
    );

    const validRegistrations = registeredEvents.filter(reg => reg !== null);

    console.log(`✅ Returning ${validRegistrations.length} valid registrations`);

    return NextResponse.json({
      success: true,
      registrations: validRegistrations
    });

  } catch (error) {
    console.error('❌ Error fetching user registrations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch registrations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}