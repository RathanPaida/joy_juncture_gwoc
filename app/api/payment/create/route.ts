import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDb from "@/lib/mongodb";
import { Event, User } from "@/models/Events";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    await connectDb();

    const { eventId, userId } = await request.json();

    const event = await Event.findById(eventId);
    const user = await User.findOne({ uid: userId });

    if (!event || !user) {
      return NextResponse.json(
        { error: "Event or user not found" },
        { status: 404 },
      );
    }

    const options = {
      amount: event.price * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId: eventId,
        userId: user._id.toString(),
        coins: event.coins,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
