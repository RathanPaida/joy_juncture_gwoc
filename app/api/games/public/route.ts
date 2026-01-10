import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Game } from "@/models/Game";

/* ================= GET ALL GAMES - PUBLIC ACCESS ================= */
export async function GET(req: NextRequest) {
  try {
    await connectDb();

    // Fetch only active/published games for public access
    const games = await Game.find({
      // You can add filters here for published games only
      // Example: status: 'active' or isPublished: true
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📡 Public API: Found ${games.length} games`);

    // Transform to match your CardGame interface
    const formattedGames = games.map((game) => ({
      id: game._id?.toString() || Math.random().toString(36).substr(2, 9),
      name: game.name || game.title || "Unnamed Game",
      description: game.description || "",
      regularPrice: game.regularPrice || game.price || "₹999",
      salePrice: game.salePrice || "₹799",
      category: Array.isArray(game.category)
        ? game.category
        : [game.category || "uncategorized"],
      players: game.players || "2-4 Players",
      duration: game.duration || "30-60 mins",
      features: Array.isArray(game.features)
        ? game.features.filter(Boolean)
        : [],
      imageUrl:
        game.imageUrl ||
        game.image ||
        "https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=400&h=225&fit=crop",
      createdAt: game.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: game.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedGames,
      count: formattedGames.length,
      message: `Found ${formattedGames.length} games`,
    });
  } catch (err: any) {
    console.error("❌ GET public games error:", err);

    // Return fallback data if database fails
    const fallbackGames = [
      {
        id: "1",
        name: "Dead Man's Deck",
        description:
          "A thrilling mystery card game where players solve a murder mystery through strategic card play.",
        regularPrice: "₹999",
        salePrice: "₹799",
        category: ["birthday-anniversary", "corporate-engagement"],
        players: "4-8 Players",
        duration: "60-90 mins",
        features: ["Team-based", "Mystery solving", "Strategy focused"],
        imageUrl:
          "https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=400&h=225&fit=crop",
      },
      {
        id: "2",
        name: "Royal Flush Royale",
        description:
          "An elegant card game perfect for weddings and formal events with a touch of sophistication.",
        regularPrice: "₹1,299",
        salePrice: "₹999",
        category: ["wedding"],
        players: "2-6 Players",
        duration: "45-75 mins",
        features: ["Elegant design", "Social interaction", "Easy to learn"],
        imageUrl:
          "https://images.unsplash.com/photo-1508739826987-b79cd8b7da12?w=400&h=225&fit=crop",
      },
      {
        id: "3",
        name: "Carnival Cards",
        description:
          "Fun and fast-paced card games perfect for carnivals and family events.",
        regularPrice: "₹899",
        salePrice: "₹699",
        category: ["carnival-games"],
        players: "2-10 Players",
        duration: "30-60 mins",
        features: ["Fast-paced", "Family friendly", "Multiple mini-games"],
        imageUrl:
          "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop",
      },
    ];

    return NextResponse.json({
      success: true,
      data: fallbackGames,
      count: fallbackGames.length,
      message: "Using fallback data - database connection failed",
      warning: err.message,
    });
  }
}
