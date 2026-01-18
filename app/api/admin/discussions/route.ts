// app/api/admin/discussions/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Discussion } from "@/models/Discussion";
import { User } from "@/models/User";

// GET all discussions for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    await connectDb();

    // Check if user is admin using your existing User model
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    const query: any = {};

    if (status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Discussion.countDocuments(query);

    // Get discussions
    const discussions = await Discussion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      discussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin discussions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch discussions",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Bulk actions
export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    await connectDb();

    // Check if user is admin using your existing User model
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, discussionIds } = body;

    if (!action || !discussionIds || !Array.isArray(discussionIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    let updateQuery: any = {};
    let message = "";

    switch (action) {
      case "delete":
        await Discussion.deleteMany({ _id: { $in: discussionIds } });
        message = "Discussions deleted permanently";
        break;

      case "archive":
        updateQuery.status = "archived";
        await Discussion.updateMany(
          { _id: { $in: discussionIds } },
          { $set: updateQuery },
        );
        message = "Discussions archived";
        break;

      case "restore":
        updateQuery.status = "active";
        await Discussion.updateMany(
          { _id: { $in: discussionIds } },
          { $set: updateQuery },
        );
        message = "Discussions restored";
        break;

      case "pin":
        updateQuery.isPinned = true;
        await Discussion.updateMany(
          { _id: { $in: discussionIds } },
          { $set: updateQuery },
        );
        message = "Discussions pinned";
        break;

      case "unpin":
        updateQuery.isPinned = false;
        await Discussion.updateMany(
          { _id: { $in: discussionIds } },
          { $set: updateQuery },
        );
        message = "Discussions unpinned";
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform action",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
