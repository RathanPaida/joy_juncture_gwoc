// app/api/admin/wallet/criteria/[id]/route.ts - FIXED FOR NEXT.JS 15
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

const criteriaSchema = new mongoose.Schema({
  type: String,
  pointsPerUnit: Number,
  description: String,
  isActive: Boolean,
  updatedAt: Date,
});

const PointsCriteria =
  mongoose.models.PointsCriteria ||
  mongoose.model("PointsCriteria", criteriaSchema);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    // ✅ Await params Promise (Next.js 15 requirement)
    const { id } = await context.params;

    console.log("=== PUT Criteria:", id);
    console.log("ID type:", typeof id);
    console.log("ID length:", id?.length);

    if (!id || id === "undefined" || id === "null") {
      console.log("❌ Invalid ID detected");
      return NextResponse.json(
        { error: "Invalid criteria ID" },
        { status: 400 },
      );
    }

    const { authorized, error } = await checkAdminAccess(req);

    if (!authorized) {
      console.log("❌ Unauthorized:", error);
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    console.log("✅ Admin verified, updating criteria...");

    await connectDb();
    const body = await req.json();
    console.log("Update data:", JSON.stringify(body, null, 2));

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format");
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if criteria exists first
    const existingCriteria = await PointsCriteria.findById(id);
    console.log(
      "📋 Existing criteria:",
      existingCriteria ? "Found" : "Not found",
    );

    if (!existingCriteria) {
      console.log("❌ Criteria not found in database");
      return NextResponse.json(
        {
          error: "Criteria not found",
          id: id,
          message: "The criteria you are trying to update does not exist",
        },
        { status: 404 },
      );
    }

    const criteria = await PointsCriteria.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!criteria) {
      console.log("❌ Update operation failed");
      return NextResponse.json(
        {
          error: "Update failed",
          message: "Failed to update criteria in database",
        },
        { status: 500 },
      );
    }

    console.log("✅ Criteria updated:", criteria._id);

    return NextResponse.json(
      {
        success: true,
        criteria,
        message: "Criteria updated successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error updating criteria:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    // ✅ Await params Promise (Next.js 15 requirement)
    const { id } = await context.params;

    console.log("=== DELETE Criteria:", id);
    console.log("ID type:", typeof id);
    console.log("ID length:", id?.length);

    if (!id || id === "undefined" || id === "null") {
      console.log("❌ Invalid ID detected");
      return NextResponse.json(
        { error: "Invalid criteria ID" },
        { status: 400 },
      );
    }

    const { authorized, error } = await checkAdminAccess(req);

    if (!authorized) {
      console.log("❌ Unauthorized:", error);
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    console.log("✅ Admin verified, deleting criteria...");

    await connectDb();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format");
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const criteria = await PointsCriteria.findByIdAndDelete(id);

    if (!criteria) {
      console.log("❌ Criteria not found in database");
      return NextResponse.json(
        {
          error: "Criteria not found",
          message: "The criteria you are trying to delete does not exist",
        },
        { status: 404 },
      );
    }

    console.log("✅ Criteria deleted:", id);

    return NextResponse.json(
      {
        success: true,
        message: "Criteria deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error deleting criteria:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      { status: 500 },
    );
  }
}
