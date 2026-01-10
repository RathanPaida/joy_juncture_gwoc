import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const productId = params.id;

    console.log("🗑️ DELETE API called with ID:", productId);

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    const cleanId = productId.trim();

    if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID format" },
        { status: 400 },
      );
    }

    const objectId = new mongoose.Types.ObjectId(cleanId);
    const result = await db.collection("products").deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    console.log("✅ Product deleted successfully");
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("💥 Error in DELETE route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 },
    );
  }
}

// GET - Get single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const productId = params.id;

    console.log("📖 GET API called with ID:", productId);

    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    const cleanId = productId.trim();

    if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID format" },
        { status: 400 },
      );
    }

    const objectId = new mongoose.Types.ObjectId(cleanId);
    const product = await db.collection("products").findOne({ _id: objectId });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const productId = params.id;
    const body = await request.json();

    console.log("✏️ PUT API called with ID:", productId);

    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    const cleanId = productId.trim();

    if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID format" },
        { status: 400 },
      );
    }

    const objectId = new mongoose.Types.ObjectId(cleanId);

    // Update product with new data
    const updatedProduct = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Remove _id from update data if present
    delete updatedProduct._id;

    const result = await db
      .collection("products")
      .updateOne({ _id: objectId }, { $set: updatedProduct });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    console.log("✅ Product updated successfully");
    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 },
    );
  }
}
