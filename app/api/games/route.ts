export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import { Game } from "@/models/Game";
import { uploadToCloudinary } from '@/lib/cloudinary';

// Helper to upload file to Cloudinary
async function uploadFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Upload to Cloudinary
  const cloudinaryUrl = await uploadToCloudinary(buffer, folder, uniqueId);
  return cloudinaryUrl;
}

/* ================= GET ALL GAMES ================= */
export async function GET(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();

    // Fetch games and map to your CardGame interface
    const games = await Game.find({}).sort({ createdAt: -1 }).lean();

    // Transform to match your CardGame interface
    const formattedGames = games.map((game) => ({
      id: game._id.toString(),
      name: game.name || game.title || "",
      description: game.description || "",
      regularPrice: game.regularPrice || game.price || "0",
      salePrice: game.salePrice || "",
      category: Array.isArray(game.category)
        ? game.category
        : [game.category || "Uncategorized"],
      players: game.players || "1-4",
      duration: game.duration || "30-60 mins",
      features: Array.isArray(game.features) ? game.features : [],
      imageUrl: game.imageUrl || game.image || "",
      createdAt: game.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: game.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedGames,
    });
  } catch (err: any) {
    console.error("GET games error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch games" },
      { status: 500 },
    );
  }
}

/* ================= CREATE GAME ================= */
/* ================= CREATE GAME ================= */
export async function POST(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();

    // Switch to FormData
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const regularPrice = formData.get('regularPrice') as string;
    const salePrice = formData.get('salePrice') as string;
    const category = JSON.parse(formData.get('category') as string || '[]');
    const players = formData.get('players') as string;
    const duration = formData.get('duration') as string;
    const features = JSON.parse(formData.get('features') as string || '[]');

    // Handle Image Upload
    const imageFile = formData.get('image') as File | null;
    let imageUrl = '';

    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile, 'games');
    } else {
      // Fallback for text URL if user managed to send it, or error
      imageUrl = (formData.get('imageUrl') as string) || "";
    }

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: `Missing required fields` },
        { status: 400 },
      );
    }

    // Transform data for database storage
    const gameData = {
      name,
      title: name,
      description,
      regularPrice: regularPrice || "0",
      salePrice: salePrice || "",
      category: Array.isArray(category) ? category : [category],
      players: players || "1-4",
      duration: duration || "30-60 mins",
      features: Array.isArray(features) ? features : [],
      imageUrl,
      createdBy: {
        userId: admin?.id || "unknown-admin",
        userEmail: admin?.email || admin?.id || "unknown@example.com",
        userRole: admin?.role || "admin",
      },
    };

    const game = await Game.create(gameData);

    // Return formatted response
    const formattedGame = {
      id: game._id.toString(),
      name: game.name,
      description: game.description,
      regularPrice: game.regularPrice,
      salePrice: game.salePrice,
      category: Array.isArray(game.category) ? game.category : [game.category],
      players: game.players,
      duration: game.duration,
      features: Array.isArray(game.features) ? game.features : [],
      imageUrl: game.imageUrl,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: formattedGame,
        message: "Game created successfully",
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST game error:", err);
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Game with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create game" },
      { status: 500 },
    );
  }
}

/* ================= UPDATE GAME ================= */
/* ================= UPDATE GAME ================= */
export async function PUT(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();

    // Switch to FormData
    const formData = await req.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 },
      );
    }

    // Extract fields
    const updateData: any = {};
    const fields = ['name', 'description', 'regularPrice', 'salePrice', 'players', 'duration'];
    fields.forEach(f => {
      const val = formData.get(f);
      if (val !== null) updateData[f] = val;
    });

    // JSON fields
    const category = formData.get('category');
    if (category) updateData.category = JSON.parse(category as string);

    const features = formData.get('features');
    if (features) updateData.features = JSON.parse(features as string);

    // Handle Image
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      updateData.imageUrl = await uploadFile(imageFile, 'games');
    }

    const updatedGame = await Game.findByIdAndUpdate(
      id,
      {
        ...updateData,
        lastEditedBy: admin?.id || "unknown-admin",
      },
      { new: true, runValidators: true },
    );

    if (!updatedGame) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    // Format response
    const formattedGame = {
      id: updatedGame._id.toString(),
      name: updatedGame.name,
      description: updatedGame.description,
      regularPrice: updatedGame.regularPrice,
      salePrice: updatedGame.salePrice,
      category: Array.isArray(updatedGame.category)
        ? updatedGame.category
        : [updatedGame.category],
      players: updatedGame.players,
      duration: updatedGame.duration,
      features: Array.isArray(updatedGame.features) ? updatedGame.features : [],
      imageUrl: updatedGame.imageUrl,
      createdAt: updatedGame.createdAt.toISOString(),
      updatedAt: updatedGame.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: formattedGame,
      message: "Game updated successfully",
    });
  } catch (err: any) {
    console.error("PUT game error:", err);
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Game with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update game" },
      { status: 500 },
    );
  }
}

/* ================= DELETE GAME ================= */
export async function DELETE(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 },
      );
    }

    const game = await Game.findById(id);

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    await Game.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Game deleted successfully",
      data: {
        id: game._id.toString(),
        name: game.name,
      },
    });
  } catch (err: any) {
    console.error("DELETE game error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete game" },
      { status: 500 },
    );
  }
}
