export const dynamic = 'force-dynamic';
// app/api/game-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/mongodb";
import GameImage from "@/models/GameImage";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Only return active images for public access
    const gameImages = await GameImage.find({ isActive: true }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: gameImages,
    });
  } catch (error: any) {
    console.error("Error fetching game images:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}