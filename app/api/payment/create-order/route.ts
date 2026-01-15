// app/api/payment/create-order/route.ts - ADD PAYMENT METHOD
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { verifyIdToken } from "@/lib/firebase-admin";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    const { amount, cartItems, shippingAddress } = await request.json();

    if (!amount || !cartItems || !shippingAddress || !cartItems.length) {
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

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;

    // Create orders
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
        status: "processing",
        paymentMethod: "razorpay", // Added required field
        shippingAddress: shippingAddress,
        trackingNumber: null,
      };

      const order = await Order.create(orderData);
      orders.push(order);
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `receipt_${orders[0]._id}`,
      notes: {
        orderIds: orders.map((o) => o._id.toString()).join(","),
        firebaseUid: firebaseUid,
        itemCount: cartItems.length,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({
      ...razorpayOrder,
      notes: {
        ...razorpayOrder.notes,
        orders: orders.map((o) => o._id.toString()),
      },
    });
  } catch (error: any) {
    console.error("❌ ERROR in payment/create-order:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create payment order",
        details:
          process.env.NODE_ENV === "development" ? error.toString() : undefined,
      },
      { status: 500 },
    );
  }
}
