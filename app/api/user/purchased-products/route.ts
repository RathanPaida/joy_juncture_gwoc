// app/api/user/purchased-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";

// Define Order schema if not exists
const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  firebaseUid: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["delivered", "shipped", "processing", "cancelled"],
    default: "processing",
  },
  shippingAddress: { type: Object },
  trackingNumber: { type: String },
});

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

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

    // Fetch user's purchased products
    const products = await Order.find({ firebaseUid: userId })
      .sort({ purchaseDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      products: JSON.parse(JSON.stringify(products)),
      count: products.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching purchased products:", error);

    // Return empty array on error
    return NextResponse.json({
      success: true,
      products: [],
      count: 0,
    });
  }
}
