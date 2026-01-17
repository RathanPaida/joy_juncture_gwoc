// app/api/admin/game-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import {connectToDatabase as connectDB } from "@/lib/mongodb";
import GameImage from "@/models/GameImage";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const gameImages = await GameImage.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: gameImages,
      total: gameImages.length,
    });
  } catch (error: any) {
    console.error("Error fetching game images:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, imageUrl, category, isActive } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Name and image URL are required" },
        { status: 400 }
      );
    }

    const gameImage = await GameImage.create({
      name,
      imageUrl,
      category: category || "general",
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({
      success: true,
      data: gameImage,
    });
  } catch (error: any) {
    console.error("Error creating game image:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}