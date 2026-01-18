// app/api/cart/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
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

// GET - Fetch cart items
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const client = await getDbClient();

    try {
      const db = client.db("joyjuncture");
      const cartCollection = db.collection("cart");

      const cartItems = await cartCollection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({
        success: true,
        items: cartItems,
        count: cartItems.length,
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { productId, productSlug, name, price, quantity, image, points } =
      body;

    // Validation
    if (!productId || !name || !price || !quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: "Quantity must be at least 1" },
        { status: 400 },
      );
    }

    const client = await getDbClient();

    try {
      const db = client.db("joyjuncture");
      const cartCollection = db.collection("cart");

      // Check if item already exists in cart
      const existingItem = await cartCollection.findOne({
        userId,
        productId,
      });

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;

        await cartCollection.updateOne(
          { _id: existingItem._id },
          {
            $set: {
              quantity: newQuantity,
              updatedAt: new Date(),
            },
          },
        );

        const updatedCart = await cartCollection.find({ userId }).toArray();

        return NextResponse.json({
          success: true,
          message: "Cart updated successfully",
          count: updatedCart.length,
          item: {
            ...existingItem,
            quantity: newQuantity,
          },
        });
      } else {
        // Add new item to cart
        const cartItem = {
          userId,
          productId,
          productSlug: productSlug || "",
          productName: name,
          productImage: image,
          price,
          quantity,
          points: points || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await cartCollection.insertOne(cartItem);
        const updatedCart = await cartCollection.find({ userId }).toArray();

        return NextResponse.json({
          success: true,
          message: "Item added to cart successfully",
          count: updatedCart.length,
          item: {
            _id: result.insertedId,
            ...cartItem,
          },
        });
      }
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}

// DELETE - Remove all cart items for user (clear cart)
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const client = await getDbClient();

    try {
      const db = client.db("joyjuncture");
      const cartCollection = db.collection("cart");

      await cartCollection.deleteMany({ userId });

      return NextResponse.json({
        success: true,
        message: "Cart cleared successfully",
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
