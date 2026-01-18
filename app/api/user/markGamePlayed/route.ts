// app/api/user/markGamePlayed/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectDb as dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { userId, gameId, gameName, score, pointsEarned } = body;

    // Validation
    if (!userId || !gameId || !gameName || pointsEarned === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, gameId, gameName, pointsEarned",
        },
        { status: 400 }
      );
    }

    if (typeof pointsEarned !== "number" || pointsEarned < 0) {
      return NextResponse.json(
        { success: false, error: "pointsEarned must be a positive number" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log("🎮 Marking game as played:", {
      userId: user._id,
      gameId,
      gameName,
      score,
      pointsEarned,
    });

    // Check if user has already played this game today (using UTC)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const alreadyPlayed = user.gamesPlayed.some((game: any) => {
      if (game.gameId !== gameId) return false;

      const playedDate = new Date(game.playedAt);
      const playedUTC = new Date(Date.UTC(
        playedDate.getUTCFullYear(),
        playedDate.getUTCMonth(),
        playedDate.getUTCDate()
      ));

      return playedUTC.getTime() === todayUTC.getTime();
    });

    if (alreadyPlayed) {
      console.log("❌ Game already played today");
      return NextResponse.json(
        {
          success: false,
          error: "Game already played. Each game can only be played once per day.",
        },
        { status: 400 }
      );
    }

    // Mark game as played using the User model method
    await user.markGameAsPlayed(gameId, gameName, score || 0, pointsEarned);

    console.log("✅ Game marked as played successfully!");
    console.log("💰 New user points:", user.userPoints);

    return NextResponse.json({
      success: true,
      message: "Game marked as played and coins added successfully",
      userPoints: user.userPoints,
      totalGamesPlayed: user.totalGamesPlayed,
      totalGamePoints: user.totalGamePoints,
      game: {
        gameId,
        gameName,
        score: score || 0,
        pointsEarned,
        playedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error marking game as played:", error);

    // Handle specific error from User model
    if (error.message === "Game already played. Each game can only be played once.") {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark game as played",
      },
      { status: 500 }
    );
  }
}