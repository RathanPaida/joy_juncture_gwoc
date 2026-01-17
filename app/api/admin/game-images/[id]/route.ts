// app/api/admin/game-images/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/mongodb";
import GameImage from "@/models/GameImage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const gameImage = await GameImage.findById(params.id);

    if (!gameImage) {
      return NextResponse.json(
        { success: false, error: "Game image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: gameImage,
    });
  } catch (error: any) {
    console.error("Error fetching game image:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, imageUrl, category, isActive } = body;

    const gameImage = await GameImage.findByIdAndUpdate(
      params.id,
      {
        name,
        imageUrl,
        category,
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!gameImage) {
      return NextResponse.json(
        { success: false, error: "Game image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: gameImage,
    });
  } catch (error: any) {
    console.error("Error updating game image:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const gameImage = await GameImage.findByIdAndDelete(params.id);

    if (!gameImage) {
      return NextResponse.json(
        { success: false, error: "Game image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Game image deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting game image:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}