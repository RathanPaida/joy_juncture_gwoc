// app/api/community/discussions/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Discussion } from "@/models/Discussion";
import { User } from "@/models/User";

// GET all discussions
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query: any = { status: "active" };

    if (category && category !== "all") {
      query.category = category;
    }

    // Build sort
    let sortOptions: any = {};
    switch (sort) {
      case "newest":
        sortOptions.createdAt = -1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      case "popular":
        sortOptions.likes = -1;
        break;
      case "hot":
        sortOptions.isHot = -1;
        sortOptions.likes = -1;
        break;
    }

    // Get total count for pagination
    const total = await Discussion.countDocuments(query);

    // Get discussions
    const discussions = await Discussion.find(query)
      .sort(sortOptions)
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
    console.error("Error fetching discussions:", error);
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

// POST create new discussion
export async function POST(request: NextRequest) {
  try {
    // Verify user
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

    const body = await request.json();
    const { title, content, category, tags } = body;

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDb();

    // Get user
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Create discussion
    const discussion = await Discussion.create({
      title,
      content,
      category,
      authorId: user._id.toString(),
      authorName: user.name,
      tags: tags || [],
      isHot: false,
    });

    // Award points for creating discussion
    user.totalPoints += 50;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Discussion created successfully! +50 JJ Points",
      discussion,
      pointsEarned: 50,
    });
  } catch (error: any) {
    console.error("Error creating discussion:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create discussion",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// PUT update discussion (admin only or author)
export async function PUT(request: NextRequest) {
  try {
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

    // Get user and check role
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { discussionId, updates } = body;

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: "Discussion ID required" },
        { status: 400 },
      );
    }

    // Find discussion
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: "Discussion not found" },
        { status: 404 },
      );
    }

    // Check if user is admin or author
    const isAdmin = ["admin", "super_admin"].includes(user.role);
    const isAuthor = discussion.authorId === user._id.toString();

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "Not authorized to update this discussion" },
        { status: 403 },
      );
    }

    // Update discussion
    Object.assign(discussion, updates);
    await discussion.save();

    return NextResponse.json({
      success: true,
      message: "Discussion updated successfully",
      discussion,
    });
  } catch (error: any) {
    console.error("Error updating discussion:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update discussion",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE discussion (admin or author)
export async function DELETE(request: NextRequest) {
  try {
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

    // Get user and check role
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get("id");

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: "Discussion ID required" },
        { status: 400 },
      );
    }

    // Find discussion
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: "Discussion not found" },
        { status: 404 },
      );
    }

    // Check if user is admin or author
    const isAdmin = ["admin", "super_admin"].includes(user.role);
    const isAuthor = discussion.authorId === user._id.toString();

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "Not authorized to delete this discussion" },
        { status: 403 },
      );
    }

    // Soft delete (change status) or hard delete based on user role
    if (isAdmin) {
      await discussion.deleteOne(); // Hard delete for admins
    } else {
      discussion.status = "deleted"; // Soft delete for authors
      await discussion.save();
    }

    return NextResponse.json({
      success: true,
      message: "Discussion deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting discussion:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete discussion",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
