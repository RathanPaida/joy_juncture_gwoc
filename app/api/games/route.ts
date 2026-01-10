import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import { Game } from "@/models/Game";

/* ================= GET ALL GAMES ================= */
export async function GET(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
    }

    await connectDb();

    // Fetch games and map to your CardGame interface
    const games = await Game.find({}).sort({ createdAt: -1 }).lean();

    // Transform to match your CardGame interface
    const formattedGames = games.map(game => ({
      id: game._id.toString(),
      name: game.name || game.title || '',
      description: game.description || '',
      regularPrice: game.regularPrice || game.price || '0',
      salePrice: game.salePrice || '',
      category: Array.isArray(game.category) ? game.category : [game.category || 'Uncategorized'],
      players: game.players || '1-4',
      duration: game.duration || '30-60 mins',
      features: Array.isArray(game.features) ? game.features : [],
      imageUrl: game.imageUrl || game.image || '',
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
      { status: 500 }
    );
  }
}

/* ================= CREATE GAME ================= */
export async function POST(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
    }

    await connectDb();
    const body = await req.json();

    // Validate required fields based on your CardGame interface
    const requiredFields = ['name', 'description', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Transform data for database storage
    const gameData = {
      name: body.name,
      title: body.name, // Store both for compatibility
      description: body.description,
      regularPrice: body.regularPrice || body.price || '0',
      salePrice: body.salePrice || '',
      category: Array.isArray(body.category) ? body.category : [body.category],
      players: body.players || '1-4',
      duration: body.duration || '30-60 mins',
      features: Array.isArray(body.features) ? body.features : [],
      imageUrl: body.imageUrl || body.image || '',
      createdBy: {
        userId: admin.id,
        userEmail: admin.email || 'admin@example.com',
        userRole: "admin",
      },
    };

    const game = await Game.create(gameData);

    // Return formatted response matching CardGame interface
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
        message: 'Game created successfully' 
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST game error:", err);
    
    // Handle duplicate errors
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Game with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create game" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE GAME ================= */
export async function PUT(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
    }

    await connectDb();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Transform update data if needed
    const transformedData = { ...updateData };
    if (updateData.category && !Array.isArray(updateData.category)) {
      transformedData.category = [updateData.category];
    }
    if (updateData.features && !Array.isArray(updateData.features)) {
      transformedData.features = [updateData.features];
    }

    const updatedGame = await Game.findByIdAndUpdate(
      id,
      {
        ...transformedData,
        lastEditedBy: admin.id,
      },
      { new: true, runValidators: true }
    );

    if (!updatedGame) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // Format response
    const formattedGame = {
      id: updatedGame._id.toString(),
      name: updatedGame.name,
      description: updatedGame.description,
      regularPrice: updatedGame.regularPrice,
      salePrice: updatedGame.salePrice,
      category: Array.isArray(updatedGame.category) ? updatedGame.category : [updatedGame.category],
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
      message: "Game updated successfully"
    });
  } catch (err: any) {
    console.error("PUT game error:", err);
    
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Game with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update game" },
      { status: 500 }
    );
  }
}

/* ================= DELETE GAME ================= */
export async function DELETE(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
    }

    await connectDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 }
      );
    }

    const game = await Game.findById(id);
    
    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    await Game.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Game deleted successfully",
      data: { 
        id: game._id.toString(), 
        name: game.name 
      }
    });
  } catch (err: any) {
    console.error("DELETE game error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete game" },
      { status: 500 }
    );
  }
}