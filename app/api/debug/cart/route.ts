export const dynamic = 'force-dynamic';
// app/api/debug/cart/route.ts - CREATE THIS TO DEBUG
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Cart } from "@/models/Cart";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get current cart
    const cart = await Cart.findOne({ userId });

    return NextResponse.json({
      success: true,
      userId: userId,
      cartExists: !!cart,
      itemCount: cart?.items?.length || 0,
      items: cart?.items || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
