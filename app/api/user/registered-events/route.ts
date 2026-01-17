// app/api/user/registered-events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";

// Define EventRegistration schema if not exists
const EventRegistrationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventId: { type: String, required: true },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventLocation: { type: String, required: true },
  ticketType: { type: String, required: true },
  participants: { type: Number, default: 1 },
  amount: { type: Number, required: true }, // Changed from totalAmount to match DB
  status: {
    type: String,
    enum: ["confirmed", "pending", "cancelled"],
    default: "confirmed",
  },
  registeredAt: { type: Date, default: Date.now },
});

const EventRegistration =
  mongoose.models.registrations ||
  mongoose.model("registrations", EventRegistrationSchema, "registrations");

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Use aggregation to join registrations with events collection
    const events = await EventRegistration.aggregate([
      // Match registrations for this user
      { $match: { userId: userId } },
      // Join with events collection
      // Note: eventId in registrations is an ObjectId, so we can match directly
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      // Unwind the eventDetails array (since 1 registration = 1 event)
      { $unwind: "$eventDetails" },
      // Sort by registration date
      { $sort: { registeredAt: -1 } },
      // Project fields to match frontend expectation
      {
        $project: {
          _id: 1,
          eventId: 1,
          // Map event details to top level fields
          eventName: "$eventDetails.name",
          eventDate: "$eventDetails.date",
          eventLocation: "$eventDetails.location",
          // Registration specific fields
          participants: { $ifNull: ["$participants", 1] }, // Default to 1 if missing
          totalAmount: "$amount", // The amount paid
          status: 1,
          registeredAt: { $ifNull: ["$registeredAt", "$createdAt"] }, // Fallback to createdAt
          ticketType: { $ifNull: ["$ticketType", "General"] },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      events: events,
      count: events.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching registered events:", error);

    // Return empty array on error
    return NextResponse.json({
      success: true,
      events: [],
      count: 0,
    });
  }
}
