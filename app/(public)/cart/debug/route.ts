// app/api/cart/debug/route.ts - TEMPORARY DEBUG ENDPOINT
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Cart } from "@/models/Cart";

export async function GET(request: NextRequest) {
  console.log("\n========================================");
  console.log("🔍 CART DEBUG ENDPOINT");
  console.log("========================================");
  
  try {
    await connectDb();
    console.log("✅ Database connected");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await verifyIdToken(token);
      console.log("✅ Token verified");
      console.log("👤 Firebase UID:", decodedToken.uid);
    } catch (error: any) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;

    // Find ALL carts (for debugging)
    const allCarts = await Cart.find({}).limit(10);
    console.log("📦 Total carts in database:", await Cart.countDocuments());
    console.log("📦 First 10 carts:");
    allCarts.forEach((cart: any) => {
      console.log(`   - UID: ${cart.firebaseUid}, Items: ${cart.items?.length || 0}`);
    });

    // Find THIS user's cart
    const userCart = await Cart.findOne({ firebaseUid });
    console.log("\n👤 User's cart:");
    if (userCart) {
      console.log("   ✅ Cart exists!");
      console.log("   📦 Cart ID:", userCart._id);
      console.log("   📦 Firebase UID:", userCart.firebaseUid);
      console.log("   📦 Items:", userCart.items?.length || 0);
      if (userCart.items && userCart.items.length > 0) {
        userCart.items.forEach((item: any, index: number) => {
          console.log(`      ${index + 1}. ${item.productName} (${item.quantity}x)`);
        });
      }
    } else {
      console.log("   ❌ No cart found for this user");
    }

    console.log("========================================\n");

    return NextResponse.json({
      success: true,
      firebaseUid,
      userCart: userCart ? {
        id: userCart._id,
        firebaseUid: userCart.firebaseUid,
        itemCount: userCart.items?.length || 0,
        items: userCart.items
      } : null,
      totalCartsInDb: await Cart.countDocuments(),
      allCartsPreview: allCarts.map((cart: any) => ({
        uid: cart.firebaseUid,
        itemCount: cart.items?.length || 0
      }))
    });

  } catch (error: any) {
    console.error("❌ Debug error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}