// import { NextRequest, NextResponse } from 'next/server';
// import connectDb from '@/lib/mongodb';
// import { Event } from '@/models/Event';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDb();

//     const event = await Event.findById(params.id);

//     if (!event) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(event);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to fetch event' },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDb();

//     const data = await request.json();
//     const event = await Event.findByIdAndUpdate(
//       params.id,
//       data,
//       { new: true, runValidators: true }
//     );

//     if (!event) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(event);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to update event' },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDb();

//     const event = await Event.findByIdAndDelete(params.id);

//     if (!event) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ message: 'Event deleted successfully' });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to delete event' },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDb();

//     const data = await request.json();
//     const event = await Event.findByIdAndUpdate(
//       params.id,
//       data,
//       { new: true }
//     );

//     if (!event) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(event);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to update event' },
//       { status: 500 }
//     );
//   }
// }
// import { NextResponse } from 'next/server';
// import { ObjectId } from 'mongodb';
// import { getEventsCollection } from '@/lib/mongodb';

// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params;

//     console.log('📖 Fetching event with ID:', id);

//     // Validate ObjectId format
//     if (!ObjectId.isValid(id)) {
//       return NextResponse.json(
//         { error: 'Invalid event ID format' },
//         { status: 400 }
//       );
//     }
//     const collection = await getEventsCollection();
//     const event = await collection.findOne({ _id: new ObjectId(params.id) });

//     if (!event) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       event: { ...event, _id: event._id.toString() }
//     });
//   } catch (error) {
//     console.error('❌ Database error:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch event', details: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params;
//     const body = await request.json();
//     console.log('✏️ Updating event with ID:', id);
//     console.log('Update data:', body);

//     // Validate ObjectId format
//     if (!ObjectId.isValid(id)) {
//       // console.error('❌ Database error:', id);
//       return NextResponse.json(
//         { error: 'Invalid event ID format' },
//         { status: 400 }
//       );
//     }
//     const collection = await getEventsCollection();

//     const result = await collection.updateOne(
//       { _id: new ObjectId(params.id) },
//       {
//         $set: {
//           ...body,
//           updatedAt: new Date()
//         }
//       }
//     );

//     if (result.matchedCount === 0) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error('❌ Database error:', error);
//     return NextResponse.json(
//       { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params;

//     console.log('🗑️ Deleting event with ID:', id);

//     // Validate ObjectId format
//     if (!ObjectId.isValid(id)) {
//       console.log('❌ Invalid ObjectId format:', id);
//       console.log("heyyyy");
//       return NextResponse.json(
//         { error: 'Invalid event ID format' },
//         { status: 400 }
//       );
//     }
//     const collection = await getEventsCollection();
//       // First, check if event exists
//     const existingEvent = await collection.findOne({ _id: new ObjectId(id) });
//     console.log('Existing event:', existingEvent);

//     if (!existingEvent) {
//       console.log('❌ Event not found in database');
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }
//     const result = await collection.deleteOne({
//       _id: new ObjectId(params.id)
//     });
//     console.log('Delete result:', result);
//     if (result.deletedCount === 0) {
//       return NextResponse.json(
//         { error: 'Event not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error('❌ Database error:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getEventsCollection } from "@/lib/mongodb";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15+
    const { id } = await context.params;

    console.log("📖 Fetching event with ID:", id);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format:", id);
      return NextResponse.json(
        { error: "Invalid event ID format" },
        { status: 400 },
      );
    }

    const collection = await getEventsCollection();
    const event = await collection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      event: { ...event, _id: event._id.toString() },
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15+
    const { id } = await context.params;
    const body = await request.json();

    console.log("✏️ Updating event with ID:", id);
    console.log("Update data:", body);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format:", id);
      return NextResponse.json(
        { error: "Invalid event ID format" },
        { status: 400 },
      );
    }

    const collection = await getEventsCollection();

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to update event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15+
    const { id } = await context.params;

    console.log("🗑️ DELETE endpoint - Received ID:", id);
    console.log("🗑️ ID type:", typeof id);
    console.log("🗑️ ID length:", id?.length);

    // Validate ObjectId format
    if (!id || typeof id !== "string" || id.length !== 24) {
      console.log("❌ Invalid ID length or type");
      return NextResponse.json(
        { error: "Invalid event ID format" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(id)) {
      console.log("❌ ObjectId.isValid failed for:", id);
      return NextResponse.json(
        { error: "Invalid event ID format" },
        { status: 400 },
      );
    }

    const collection = await getEventsCollection();

    // First, check if event exists
    const existingEvent = await collection.findOne({ _id: new ObjectId(id) });
    console.log("Existing event:", existingEvent ? "Found" : "Not found");

    if (!existingEvent) {
      console.log("❌ Event not found in database");
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    console.log("✅ Delete result:", result);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Event not found or already deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
