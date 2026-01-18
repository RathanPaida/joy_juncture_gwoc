export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { uploadToCloudinary } from '@/lib/cloudinary';

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

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

// PUT - Update product with image upload support
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    console.log("✏️ PUT API called with ID:", productId);

    const contentType = request.headers.get("content-type") || "";

    let updateData: any = {};
    let savedImages: any[] = [];
    let existingImages: any[] = [];

    // Check if we are receiving FormData (for file uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      // Extract basic fields
      updateData.name = formData.get("name") as string;
      updateData.slug = formData.get("slug") as string;
      updateData.shortDescription = formData.get("shortDescription") as string;
      updateData.story = formData.get("story") as string;
      updateData.gametype = formData.get("gametype") as string;
      updateData.category = [formData.get("category") as string]; // Assuming single category for now

      const priceAmount = formData.get("price.amount");
      const priceCurrency = formData.get("price.currency");
      if (priceAmount) {
        updateData.price = {
          amount: parseFloat(priceAmount.toString()),
          currency: priceCurrency?.toString() || "INR",
        };
      }

      const stockQuantity = formData.get("stock.quantity");
      const stockAvailable = formData.get("stock.available");
      if (stockQuantity) {
        updateData.stock = {
          quantity: parseInt(stockQuantity.toString()),
          available: stockAvailable === "true",
        };
      }

      // Meta fields
      const players = formData.get("meta.players");
      const duration = formData.get("meta.duration");
      const age = formData.get("meta.age");
      const difficulty = formData.get("meta.difficulty");
      const moods = formData.get("meta.moods");
      const badges = formData.get("meta.badges");

      updateData.meta = {
        players: players?.toString() || "",
        duration: duration?.toString() || "",
        age: age?.toString() || "",
        difficulty: difficulty?.toString() || "Easy",
        moods: moods ? JSON.parse(moods.toString()) : [],
        badges: badges ? JSON.parse(badges.toString()) : [],
      };

      // How to Play fields
      updateData.howToPlay = {
        setup: formData.get("howToPlay.setup")?.toString() || "",
        gameplay: formData.get("howToPlay.gameplay")?.toString() || "",
        winning: formData.get("howToPlay.winning")?.toString() || "",
      };

      // Key Features
      const keyFeatures = formData.get("keyFeatures");
      if (keyFeatures) {
        updateData.keyFeatures = JSON.parse(keyFeatures.toString());
      }

      const faqs = formData.get("faqs");
      if (faqs) {
        updateData.faqs = JSON.parse(faqs.toString());
      }

      const whatYouGet = formData.get("whatYouGet");
      if (whatYouGet) {
        updateData.whatYouGet = JSON.parse(whatYouGet.toString());
      }

      // Handle Existing Images (passed as JSON string of objects)
      const existingImagesStr = formData.get("existingImages");
      if (existingImagesStr) {
        existingImages = JSON.parse(existingImagesStr.toString());
      }

      // Handle New Image Uploads
      const newImageFiles = formData.getAll("newImages") as File[];

      if (newImageFiles.length > 0) {
        // Generate unique ID function
        const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

        savedImages = await Promise.all(
          newImageFiles.map(async (file) => {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Generate unique filename
            const uniqueId = generateUniqueId();

            // Upload to Cloudinary
            const cloudinaryUrl = await uploadToCloudinary(buffer, 'products', uniqueId);

            return {
              url: cloudinaryUrl,
              isPrimary: false,
              filename: file.name
            };
          })
        );
      }

      // Merge images
      // The frontend should send `images` array with mixture of existing and placeholders for new?
      // Simplified approach: Just append new keys. 
      // User might delete old ones. Frontend sends "existingImages" which are the ones KEPT.
      // Then we append "savedImages".

      let finalImages = [...existingImages, ...savedImages];

      // Handle Primary Image Flag
      // Frontend can send "primaryImageIndex" relative to the MERGED list, OR
      // we can handle it by trusting the `isPrimary` flag in existingImages, 
      // and checking if a new image was supposed to be primary.
      // Let's assume frontend sets isPrimary on existingImages correctly.
      // For new images, maybe we pass an index?
      // Let's rely on JSON data passed in `imageMetadata` if needed, 
      // OR just rely on simple logic: if merged list has no primary, make first one primary.

      // Update primary flag based on frontend input if simpler:
      const primaryIndexStr = formData.get("primaryImageIndex");
      if (primaryIndexStr !== null) {
        const primaryIdx = parseInt(primaryIndexStr.toString());
        finalImages = finalImages.map((img, idx) => ({
          ...img,
          isPrimary: idx === primaryIdx
        }));
      }

      updateData.images = finalImages;

      // Backward compat for `media` field
      if (finalImages.length > 0) {
        const primary = finalImages.find(img => img.isPrimary) || finalImages[0];
        updateData.media = {
          thumbnail: primary.url,
          images: finalImages.map(img => img.url)
        };
      }

    } else {
      // Fallback to JSON (Legacy or direct API usage)
      updateData = await request.json();
    }

    updateData.updatedAt = new Date().toISOString();
    delete updateData._id; // Safety

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

    const result = await db
      .collection("products")
      .updateOne({ _id: objectId }, { $set: updateData });

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
      product: updateData
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 },
    );
  }
}
