// app/api/admin/discussions/bulk/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    await connectDb();

    // Verify token and admin role
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    await verifyIdToken(token);

    // Check admin role
    const roleResponse = await fetch(
      `${request.nextUrl.origin}/api/user/role`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!roleResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const roleData = await roleResponse.json();
    const userRole = roleData.success ? roleData.role : roleData.role;

    if (!["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { action, discussionIds } = await request.json();

    if (!action || !discussionIds || !Array.isArray(discussionIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    console.log(
      `🔧 Admin bulk action: ${action} on ${discussionIds.length} discussions`,
    );

    if (!mongoose.connection.db) {
      throw new Error("Database not connected");
    }

    const Discussion = mongoose.connection.db.collection("discussions");

    // Convert IDs to ObjectIds
    const objectIds = discussionIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    let affectedCount = 0;

    switch (action) {
      case "delete": {
        const deleteResult = await Discussion.deleteMany({
          _id: { $in: objectIds },
        });
        affectedCount = deleteResult.deletedCount;
        console.log(`✅ Deleted ${affectedCount} discussions`);
        break;
      }

      case "archive": {
        const updateResult = await Discussion.updateMany(
          { _id: { $in: objectIds } },
          { $set: { status: "archived" } },
        );
        affectedCount = updateResult.modifiedCount;
        console.log(`✅ Archived ${affectedCount} discussions`);
        break;
      }

      case "restore": {
        const updateResult = await Discussion.updateMany(
          { _id: { $in: objectIds } },
          { $set: { status: "active" } },
        );
        affectedCount = updateResult.modifiedCount;
        console.log(`✅ Restored ${affectedCount} discussions`);
        break;
      }

      case "pin": {
        const updateResult = await Discussion.updateMany(
          { _id: { $in: objectIds } },
          { $set: { isPinned: true } },
        );
        affectedCount = updateResult.modifiedCount;
        console.log(`✅ Pinned ${affectedCount} discussions`);
        break;
      }

      case "unpin": {
        const updateResult = await Discussion.updateMany(
          { _id: { $in: objectIds } },
          { $set: { isPinned: false } },
        );
        affectedCount = updateResult.modifiedCount;
        console.log(`✅ Unpinned ${affectedCount} discussions`);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${discussionIds.length} discussions`,
      count: affectedCount,
    });
  } catch (error: any) {
    console.error("❌ Error performing bulk action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to perform bulk action",
      },
      { status: 500 },
    );
  }
}
