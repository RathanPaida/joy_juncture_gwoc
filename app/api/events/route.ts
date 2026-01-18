
import { NextResponse } from 'next/server';
import { getEventsCollection } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 0;

    const collection = await getEventsCollection();
    let query = {};
    let sort = {};
    const now = new Date();

    if (type === 'upcoming') {
      // Future events, nearest first
      query = { date: { $gte: now }, isActive: { $ne: false } };
      sort = { date: 1 };
    } else if (type === 'past') {
      // Past events, most recent first
      query = { date: { $lt: now } };
      sort = { date: -1 };
    } else {
      // Default: all events, newest created first
      sort = { createdAt: -1 };
    }

    let cursor = collection.find(query).sort(sort);

    if (limit > 0) {
      cursor = cursor.limit(limit);
    }

    const events = await cursor.toArray();

    // Return events array directly, not nested in an object
    return NextResponse.json(
      events.map((event: any) => ({
        ...event,
        _id: event._id.toString(),
      })),
    );
  } catch (error) {
    console.error("❌ Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
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
      detailedDescription: body.detailedDescription,
      date: new Date(body.date),
      price: body.price || 0,
      coins: body.coins || 0,
      Venue: body.Venue || '',
      collabWith: body.collabWith || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalSeats: body.totalSeats,
      availableSeats: body.availableSeats,
      gallery: body.gallery || [],
      postEventDescription: body.postEventDescription || '',
    };
    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    console.error("❌ Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to create event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}