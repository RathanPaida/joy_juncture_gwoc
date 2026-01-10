// app/api/cart/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";

const uri = process.env.MONGODB_URI!;

export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId" },
        { status: 400 },
      );
    }

    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("joyjuncture");
      const cartCollection = db.collection("cart");

      const result = await cartCollection.deleteOne({
        _id: new ObjectId(itemId),
        userId,
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Item not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Item removed successfully",
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Error removing item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove item" },
      { status: 500 },
    );
  }
}
