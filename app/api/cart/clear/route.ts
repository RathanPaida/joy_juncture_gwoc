export const dynamic = 'force-dynamic';
// app/api/cart/clear/route.ts - MATCHES YOUR CART API STRUCTURE
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";

const uri = process.env.MONGODB_URI!;

async function getDbClient() {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

// Helper function to verify auth token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  console.log("\n========================================");
  console.log("🧹 CART CLEAR API - DELETE METHOD");
  console.log("========================================");

  try {
    const userId = await verifyAuth(request);
    console.log("👤 User ID:", userId);

    if (!userId) {
      console.log("❌ Unauthorized - no valid user ID");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await getDbClient();
    console.log("✅ Database client connected");

    try {
      const db = client.db("joyjuncture");
      const cartCollection = db.collection("cart");

      console.log("🔍 Checking for cart items...");

      // Check if cart items exist
      const existingItems = await cartCollection.find({ userId }).toArray();
      console.log("📦 Cart items found:", existingItems.length);

      if (existingItems.length === 0) {
        console.log("⚠️ No cart items to delete");
        return NextResponse.json({
          success: true,
          message: "Cart is already empty",
          cleared: false,
          cartFound: false,
        });
      }

      // Log items to be deleted
      console.log("📦 Items to delete:");
      existingItems.forEach((item: any, index: number) => {
        console.log(`   ${index + 1}. ${item.productName} (${item.quantity}x) - ₹${item.price}`);
      });

      // Delete all cart items for this user
      console.log("🗑️ Deleting cart items...");
      const deleteResult = await cartCollection.deleteMany({ userId });

      console.log("🗑️ Delete result:");
      console.log("   - Acknowledged:", deleteResult.acknowledged);
      console.log("   - Deleted count:", deleteResult.deletedCount);

      // Verify deletion
      console.log("🔍 Verifying deletion...");
      const verifyItems = await cartCollection.find({ userId }).toArray();
      console.log("✅ Remaining items:", verifyItems.length);

      if (verifyItems.length > 0) {
        console.error("❌ CART ITEMS STILL EXIST!");
        return NextResponse.json(
          {
            success: false,
            error: "Cart deletion failed - items still exist",
            deletedCount: deleteResult.deletedCount
          },
          { status: 500 }
        );
      }

      console.log("🎉 CART CLEARED SUCCESSFULLY!");
      console.log("========================================\n");

      return NextResponse.json({
        success: true,
        message: "Cart cleared successfully",
        cleared: true,
        cartFound: true,
        itemsCleared: existingItems.length,
        deletedCount: deleteResult.deletedCount,
      });

    } finally {
      await client.close();
      console.log("✅ Database connection closed");
    }
  } catch (error: any) {
    console.error("\n========================================");
    console.error("❌ CRITICAL ERROR IN CART CLEAR");
    console.error("========================================");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("========================================\n");

    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message}`,
        errorType: error.name
      },
      { status: 500 }
    );
  }
}

// Also support POST method
export async function POST(request: NextRequest) {
  console.log("⚠️ POST method called, redirecting to DELETE logic");
  return DELETE(request);
}