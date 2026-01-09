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
      // events.map(event => ({
      events.map((event: { _id: { toString: () => any; }; }) => ({
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
    console.log('📝 Creating new event:', body);
    
    // Validate required fields
    if (!body.name || !body.description || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and date are required' },
        { status: 400 }
      );
    }
    const collection = await getEventsCollection();
    // Prepare event data
    const eventData = {
      name: body.name,
      description: body.description,
      date: new Date(body.date),
      price: body.price || 0,
      coins: body.coins || 0,
      registrationLink: body.registrationLink || '',
      collabWith: body.collabWith || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }; 
    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Event created with ID:', result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId.toString(),
      event: {
        ...eventData,
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}