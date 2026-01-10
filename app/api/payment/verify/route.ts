// app/api/payment/verify/route.ts - REPLACE WITH THIS
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    await connectDb();

    // Verify Firebase token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Invalid token" },
        { status: 401 },
      );
    }

    const firebaseUid = decodedToken.uid;

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 },
      );
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // Update all orders for this user that are processing
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const updatedOrders = await Order.updateMany(
      {
        firebaseUid: firebaseUid,
        status: "processing",
        purchaseDate: { $gte: tenMinutesAgo },
      },
      {
        $set: {
          status: "completed",
          trackingNumber: razorpay_payment_id,
        },
      },
    );

    console.log("✅ Orders updated:", updatedOrders.modifiedCount);

    // Calculate total amount from all updated orders
    const orders = await Order.find({
      firebaseUid: firebaseUid,
      trackingNumber: razorpay_payment_id,
    });

    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    console.log("💰 Total amount:", totalAmount);

    // Calculate Joy Points (total ÷ 10)
    const joyPoints = Math.floor(totalAmount / 10);
    console.log("🎁 Joy points to add:", joyPoints);

    // Update BOTH walletBalance AND totalPoints
    const userUpdate = await User.findOneAndUpdate(
      { firebaseUid: firebaseUid },
      {
        $inc: {
          walletBalance: joyPoints,
          totalPoints: joyPoints,
        },
      },
      { new: true },
    );

    console.log("✅ User wallet updated:", userUpdate?.walletBalance);
    console.log("✅ User points updated:", userUpdate?.totalPoints);

    return NextResponse.json({
      success: true,
      ordersUpdated: updatedOrders.modifiedCount,
      orderIds: orders.map((o) => o._id.toString()),
      joyPointsEarned: joyPoints,
    });
  } catch (error: any) {
    console.error("❌ Payment verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Payment verification failed" },
      { status: 500 },
    );
  }
}
