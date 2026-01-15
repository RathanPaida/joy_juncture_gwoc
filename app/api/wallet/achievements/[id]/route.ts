// app/api/admin/wallet/achievements/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  points: Number,
  requirement: Number,
  category: String,
  isActive: Boolean,
  updatedAt: Date,
});

const Achievement =
  mongoose.models.Achievement ||
  mongoose.model("Achievement", achievementSchema);

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15
    const { id } = await context.params;

    console.log("========================================");
    console.log("PUT /api/admin/wallet/achievements/" + id);
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
    console.log("📦 Update data:", JSON.stringify(body, null, 2));

    const achievement = await Achievement.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true },
    );

    if (!achievement) {
      console.log("❌ Achievement not found:", id);
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 },
      );
    }

    console.log("✅ Achievement updated:", achievement._id);

    return NextResponse.json({
      success: true,
      achievement,
      message: "Achievement updated successfully",
    });
  } catch (error: any) {
    console.error("❌ ERROR in PUT achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15
    const { id } = await context.params;

    console.log("========================================");
    console.log("DELETE /api/admin/wallet/achievements/" + id);
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

    const achievement = await Achievement.findByIdAndDelete(id);

    if (!achievement) {
      console.log("❌ Achievement not found:", id);
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 },
      );
    }

    console.log("✅ Achievement deleted:", id);

    return NextResponse.json({
      success: true,
      message: "Achievement deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ ERROR in DELETE achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Optional: GET method to retrieve specific achievement
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15
    const { id } = await context.params;

    console.log("========================================");
    console.log("GET /api/admin/wallet/achievements/" + id);
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

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      console.log("❌ Achievement not found:", id);
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 },
      );
    }

    console.log("✅ Achievement retrieved:", achievement._id);

    return NextResponse.json({
      success: true,
      achievement,
    });
  } catch (error: any) {
    console.error("❌ ERROR in GET achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Optional: PATCH method for partial updates
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Await params in Next.js 15
    const { id } = await context.params;

    console.log("========================================");
    console.log("PATCH /api/admin/wallet/achievements/" + id);
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
    console.log("📦 Patch data:", JSON.stringify(body, null, 2));

    // Only update fields that are provided
    const updateData: any = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.points !== undefined) updateData.points = body.points;
    if (body.requirement !== undefined)
      updateData.requirement = body.requirement;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const achievement = await Achievement.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!achievement) {
      console.log("❌ Achievement not found:", id);
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 },
      );
    }

    console.log("✅ Achievement patched:", achievement._id);

    return NextResponse.json({
      success: true,
      achievement,
      message: "Achievement updated successfully",
    });
  } catch (error: any) {
    console.error("❌ ERROR in PATCH achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
