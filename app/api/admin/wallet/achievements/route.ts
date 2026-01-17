// app/api/admin/wallet/achievements/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: "FaTrophy" },
  points: { type: Number, required: true },
  requirement: { type: Number, required: true },
  category: { type: String, default: "general" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add pre-save middleware to update timestamp
achievementSchema.pre("save", function (next) {
  this.updatedAt = new Date();
});

const Achievement =
  mongoose.models.Achievement ||
  mongoose.model("Achievement", achievementSchema);

export async function GET(req: NextRequest) {
  try {
    console.log("=== Admin: Fetching All Achievements ===");

    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      console.log("Unauthorized access attempt:", error);
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();

    const achievements = await Achievement.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log("Total achievements in database:", achievements.length);

    return NextResponse.json({
      success: true,
      achievements,
      count: achievements.length,
    });
  } catch (error: any) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== Admin: Creating New Achievement ===");

    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.description || !body.points || !body.requirement) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, description, points, requirement",
        },
        { status: 400 },
      );
    }

    console.log("Creating achievement with data:", {
      name: body.name,
      points: body.points,
      requirement: body.requirement,
    });

    const achievement = new Achievement({
      name: body.name,
      description: body.description,
      icon: body.icon || "FaTrophy",
      points: body.points,
      requirement: body.requirement,
      category: body.category || "general",
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    await achievement.save();

    console.log("Achievement created successfully:", achievement._id);

    return NextResponse.json(
      {
        success: true,
        achievement,
        message: "Achievement created successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating achievement:", error);
    return NextResponse.json(
      { error: "Failed to create achievement", details: error.message },
      { status: 500 },
    );
  }
}
