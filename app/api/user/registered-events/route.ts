// app/api/user/registered-events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";

// Define EventRegistration schema if not exists
const EventRegistrationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  firebaseUid: { type: String, required: true },
  eventId: { type: String, required: true },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventLocation: { type: String, required: true },
  ticketType: { type: String, required: true },
  participants: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["confirmed", "pending", "cancelled"],
    default: "confirmed",
  },
  registeredAt: { type: Date, default: Date.now },
});

const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model("EventRegistration", EventRegistrationSchema);

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

    // Fetch user's registered events
    const events = await EventRegistration.find({ firebaseUid: userId })
      .sort({ registeredAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      events: JSON.parse(JSON.stringify(events)),
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
