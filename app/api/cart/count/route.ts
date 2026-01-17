export const dynamic = 'force-dynamic';
// app/api/cart/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";

const uri = process.env.MONGODB_URI!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("joyjuncture");
      const cartCollection = db.collection("cart");

      const count = await cartCollection.countDocuments({ userId });

      return NextResponse.json({
        success: true,
        count,
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart count" },
      { status: 500 },
    );
  }
}
