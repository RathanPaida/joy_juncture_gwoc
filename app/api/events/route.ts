// import { NextRequest, NextResponse } from 'next/server';
// import connectDb from '@/lib/mongodb';
// import { Event } from '@/models/Event';

// export async function GET(request: NextRequest) {
//   try {
//     await connectDb();
    
//     const searchParams = request.nextUrl.searchParams;
//     const type = searchParams.get('type'); // 'upcoming' or 'past'
    
//     const now = new Date();
//     // Set to start of day for accurate comparison
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     let query = {};
    
//     if (type === 'upcoming') {
//       query = { date: { $gte: today } };
//     } else if (type === 'past') {
//       query = { date: { $lt: today } };
//     }
    
//     const events = await Event.find(query)
//       .sort({ date: type === 'upcoming' ? 1 : -1 })
//       .lean();
//      // Convert to plain objects with string IDs
//      const serializedEvents = events.map(event => ({
//       ...event,
//       _id: event._id.toString(),
//       date: event.date.toISOString(),
//       createdAt: event.createdAt?.toISOString(),
//     }));
    
//     return NextResponse.json(serializedEvents);
//     // return NextResponse.json(events);
//   } catch (error) {
//     console.error('Error fetching events:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch events' },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await connectDb();
    
//     // Add admin authentication check here
//     const data = await request.json();
    
//     const event = await Event.create(data);
    
//     return NextResponse.json(event, { status: 201 });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to create event' },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from 'next/server';
import { getEventsCollection } from '@/lib/mongodb';

export async function GET() {
  try {
    const collection = await getEventsCollection();
    const events = await collection.find({}).toArray();
    
    // Return events array directly, not nested in an object
    return NextResponse.json(
      events.map(event => ({
        ...event,
        _id: event._id.toString()
      }))
    );
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const collection = await getEventsCollection();
    
    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}