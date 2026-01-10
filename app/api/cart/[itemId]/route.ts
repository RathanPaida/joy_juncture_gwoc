// app/api/cart/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15
    const { itemId } = await context.params;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Remove item from cart
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $pull: {
          cart: { productId: itemId },
        },
      },
      {
        new: true,
        projection: { cart: 1 },
      },
    );

    if (user) {
      return NextResponse.json({
        success: true,
        message: "Item removed from cart",
        count: user.cart?.length || 0,
      });
    }

    return NextResponse.json(
      { error: "Item not found in cart" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15
    const { itemId } = await context.params;
    const body = await request.json();
    const { quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Update item quantity in cart
    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
        "cart.productId": itemId,
      },
      {
        $set: {
          "cart.$.quantity": Number(quantity),
          "cart.$.addedAt": new Date(),
        },
      },
      {
        new: true,
        projection: { cart: 1 },
      },
    );

    if (user) {
      return NextResponse.json({
        success: true,
        message: "Cart updated",
        count: user.cart?.length || 0,
      });
    }

    return NextResponse.json(
      { error: "Item not found in cart" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Optional: GET method to retrieve specific cart item
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15
    const { itemId } = await context.params;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Find user and specific cart item
    const user = await User.findOne(
      {
        email: session.user.email,
        "cart.productId": itemId,
      },
      {
        "cart.$": 1, // Return only the matching cart item
      },
    );

    if (user && user.cart?.length > 0) {
      return NextResponse.json({
        success: true,
        item: user.cart[0],
      });
    }

    return NextResponse.json(
      { error: "Item not found in cart" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error fetching cart item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Optional: PATCH method for partial updates
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15
    const { itemId } = await context.params;
    const body = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Build update object dynamically
    const updateObj: any = {};
    if (body.quantity !== undefined) {
      updateObj["cart.$.quantity"] = Number(body.quantity);
    }
    if (body.selectedColor !== undefined) {
      updateObj["cart.$.selectedColor"] = body.selectedColor;
    }
    if (body.selectedSize !== undefined) {
      updateObj["cart.$.selectedSize"] = body.selectedSize;
    }
    if (body.notes !== undefined) {
      updateObj["cart.$.notes"] = body.notes;
    }

    // Always update the timestamp
    updateObj["cart.$.addedAt"] = new Date();

    // Update specific fields of cart item
    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
        "cart.productId": itemId,
      },
      {
        $set: updateObj,
      },
      {
        new: true,
        projection: { cart: 1 },
      },
    );

    if (user) {
      return NextResponse.json({
        success: true,
        message: "Cart item updated",
        count: user.cart?.length || 0,
      });
    }

    return NextResponse.json(
      { error: "Item not found in cart" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
