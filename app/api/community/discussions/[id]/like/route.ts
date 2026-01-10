// app/api/community/discussions/[id]/like/route.ts - TYPESCRIPT FIXED
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(
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

    console.log("❤️ Like discussion:", discussionId, "by user:", userId);

    // Check database connection
    if (!mongoose.connection.db) {
      throw new Error("Database not connected");
    }

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

    // Check if user already liked
    const likedBy = discussion.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    let action;
    if (hasLiked) {
      // Unlike
      await Discussion.updateOne(
        { _id: new mongoose.Types.ObjectId(discussionId) },
        {
          $pull: { likedBy: userId } as any,
          $inc: { likes: -1 },
        },
      );
      action = "unlike";
      console.log("👎 Discussion unliked");
    } else {
      // Like
      await Discussion.updateOne(
        { _id: new mongoose.Types.ObjectId(discussionId) },
        {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 },
        },
      );
      action = "like";

      // Award 5 points for liking
      await User.findOneAndUpdate(
        { firebaseUid: userId },
        { $inc: { totalPoints: 5, walletBalance: 5 } },
      );

      console.log("👍 Discussion liked, +5 points");
    }

    return NextResponse.json({
      success: true,
      action: action,
      message:
        action === "like"
          ? "Discussion liked! +5 points"
          : "Discussion unliked",
    });
  } catch (error: any) {
    console.error("❌ Error liking discussion:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to like discussion" },
      { status: 500 },
    );
  }
}
