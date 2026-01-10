// app/api/orders/create/route.ts - REPLACE WITH THIS
import { NextRequest, NextResponse } from "next/server";
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

    const { cartItems, shippingAddress, paymentMethod, total } =
      await request.json();

    if (!cartItems || !shippingAddress || !paymentMethod || !cartItems.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user
    const user = await User.findOne({ firebaseUid: firebaseUid });
    if (!user) {
      return NextResponse.json(
        {
          error:
            "User not found in database. Please complete your profile first.",
        },
        { status: 404 },
      );
    }

    console.log("📦 Creating orders for", cartItems.length, "items");

    // Create separate order for EACH item
    const orders = [];
    for (const item of cartItems) {
      const orderData = {
        userId: user._id.toString(),
        firebaseUid: firebaseUid,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage || "",
        quantity: item.quantity || 1,
        price: item.price,
        totalAmount: item.price * (item.quantity || 1),
        purchaseDate: new Date(),
        status: "completed",
        paymentMethod: paymentMethod,
        shippingAddress: shippingAddress,
        trackingNumber: `COD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };

      const order = await Order.create(orderData);
      orders.push(order);
      console.log("✅ Order created:", order._id);
    }

    // Calculate total amount from all orders
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
      orderIds: orders.map((o) => o._id.toString()),
      ordersCreated: orders.length,
      joyPointsEarned: joyPoints,
    });
  } catch (error: any) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
