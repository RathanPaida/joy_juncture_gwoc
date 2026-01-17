export const dynamic = 'force-dynamic';
// app/api/admin/wallet/rewards/route.ts - WITH DEBUG LOGGING
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  points: { type: Number, required: true },
  category: { type: String, required: true },
  icon: { type: String, default: "FaGift" },
  color: { type: String, default: "#FF8C00" },
  stock: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);

export async function GET(req: NextRequest) {
  try {
    console.log("========================================");
    console.log("GET /api/admin/wallet/rewards");
    console.log("========================================");

    const { authorized, error } = await checkAdminAccess(req);

    if (!authorized) {
      console.log("❌ AUTHORIZATION FAILED:", error);
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    console.log("✅ Authorization passed");

    await connectDb();
    console.log("✅ Database connected");

    // Use raw MongoDB to ensure _id is included
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 },
      );
    }

    const rewards = await db
      .collection("rewards")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${rewards.length} rewards`);

    // Log first reward to verify _id exists
    if (rewards.length > 0) {
      console.log("📋 First reward:", {
        _id: rewards[0]._id,
        name: rewards[0].name,
        hasId: !!rewards[0]._id,
      });
    }

    // Convert MongoDB _id to string for JSON
    const rewardsWithStringIds = rewards.map((r) => ({
      ...r,
      _id: r._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      rewards: rewardsWithStringIds,
      count: rewards.length,
    });
  } catch (error: any) {
    console.error("❌ ERROR in GET rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("========================================");
    console.log("POST /api/admin/wallet/rewards");
    console.log("========================================");

    const { authorized, error } = await checkAdminAccess(req);

    if (!authorized) {
      console.log("❌ AUTHORIZATION FAILED:", error);
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    console.log("✅ Authorization passed");

    await connectDb();
    console.log("✅ Database connected");

    const body = await req.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.name || !body.description || !body.points || !body.category) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        {
          error: "Missing required fields: name, description, points, category",
        },
        { status: 400 },
      );
    }

    console.log("✅ Validation passed");

    const reward = new Reward({
      name: body.name,
      description: body.description,
      points: body.points,
      category: body.category,
      icon: body.icon || "FaGift",
      color: body.color || "#FF8C00",
      stock: body.stock || 100,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    await reward.save();
    console.log("✅ Reward saved with ID:", reward._id);

    return NextResponse.json(
      {
        success: true,
        reward,
        message: "Reward created successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("❌ ERROR in POST rewards:", error);
    return NextResponse.json(
      { error: "Failed to create reward", details: error.message },
      { status: 500 },
    );
  }
}
