export const dynamic = 'force-dynamic';
// app/api/community/discussions/[id]/route.ts - TYPESCRIPT FIXED
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";
import { verifyIdToken } from "@/lib/firebase-admin";

// GET - Fetch single discussion
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDb();

    const params = await context.params;
    const discussionId = params.id;

    console.log("📖 Fetching discussion with ID:", discussionId);
    console.log("📖 ID type:", typeof discussionId);
    console.log("📖 ID length:", discussionId.length);

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      console.log("❌ Invalid MongoDB ObjectId format");
      return NextResponse.json(
        { success: false, error: "Invalid discussion ID format" },
        { status: 400 },
      );
    }

    // Check database connection
    if (!mongoose.connection.db) {
      throw new Error("Database not connected");
    }

    // Get Discussion collection directly
    const Discussion = mongoose.connection.db.collection("discussions");

    // Try to find by _id
    const discussion = await Discussion.findOne({
      _id: new mongoose.Types.ObjectId(discussionId),
    });

    console.log("📦 Discussion found:", !!discussion);

    if (!discussion) {
      // Try to find any discussion to see what fields exist
      const anyDiscussion = await Discussion.findOne({});
      console.log(
        "📦 Sample discussion structure:",
        anyDiscussion ? Object.keys(anyDiscussion) : "No discussions exist",
      );

      return NextResponse.json(
        { success: false, error: "Discussion not found" },
        { status: 404 },
      );
    }

    // Increment view count
    await Discussion.updateOne(
      { _id: new mongoose.Types.ObjectId(discussionId) },
      { $inc: { viewCount: 1 } },
    );

    console.log("✅ Discussion found:", discussion.title);

    return NextResponse.json({
      success: true,
      discussion: {
        _id: discussion._id.toString(),
        title: discussion.title,
        content: discussion.content,
        category: discussion.category,
        authorId: discussion.authorId,
        authorName: discussion.authorName,
        replies: discussion.replies || [],
        likes: discussion.likes || 0,
        likedBy: discussion.likedBy || [],
        isHot: discussion.isHot || false,
        isPinned: discussion.isPinned || false,
        tags: discussion.tags || [],
        viewCount: (discussion.viewCount || 0) + 1,
        status: discussion.status || "active",
        createdAt: discussion.createdAt,
        updatedAt: discussion.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching discussion:", error);
    console.error("❌ Error stack:", error.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch discussion" },
      { status: 500 },
    );
  }
}

// DELETE - Delete discussion
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDb();

    // Verify token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const params = await context.params;
    const discussionId = params.id;

    console.log("🗑️ Deleting discussion:", discussionId, "by user:", userId);

    // Check database connection
    if (!mongoose.connection.db) {
      throw new Error("Database not connected");
    }

    // Get Discussion collection
    const Discussion = mongoose.connection.db.collection("discussions");

    // Find discussion
    const discussion = await Discussion.findOne({
      _id: new mongoose.Types.ObjectId(discussionId),
    });

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: "Discussion not found" },
        { status: 404 },
      );
    }

    // Check if user is author or admin
    const isAuthor = discussion.authorId === userId;

    // Check admin status
    const roleResponse = await fetch(
      `${request.nextUrl.origin}/api/user/role`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    let isAdmin = false;
    if (roleResponse.ok) {
      const roleData = await roleResponse.json();
      const userRole = roleData.success ? roleData.role : roleData.role;
      isAdmin = ["admin", "super_admin"].includes(userRole);
    }

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this discussion" },
        { status: 403 },
      );
    }

    // Delete discussion
    await Discussion.deleteOne({
      _id: new mongoose.Types.ObjectId(discussionId),
    });

    console.log("✅ Discussion deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Discussion deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting discussion:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete discussion" },
      { status: 500 },
    );
  }
}

// PUT - Update discussion (for pinning, etc.)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDb();

    // Verify token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    await verifyIdToken(token);

    const params = await context.params;
    const discussionId = params.id;
    const body = await request.json();

    console.log("✏️ Updating discussion:", discussionId, body);

    // Check database connection
    if (!mongoose.connection.db) {
      throw new Error("Database not connected");
    }

    // Get Discussion collection
    const Discussion = mongoose.connection.db.collection("discussions");

    // Update discussion
    const result = await Discussion.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(discussionId) },
      { $set: body },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Discussion not found" },
        { status: 404 },
      );
    }

    console.log("✅ Discussion updated successfully");

    return NextResponse.json({
      success: true,
      discussion: result,
    });
  } catch (error: any) {
    console.error("❌ Error updating discussion:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update discussion" },
      { status: 500 },
    );
  }
}
