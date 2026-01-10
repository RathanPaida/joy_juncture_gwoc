// app/api/wallet/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";
import { User, Transaction } from "@/models/User";
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
});

const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);

export async function POST(req: NextRequest) {
  try {
    console.log("=== Processing Reward Redemption ===");

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Get request body
    const { rewardId } = await req.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID is required" },
        { status: 400 },
      );
    }

    // Find the reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    if (!reward.isActive) {
      return NextResponse.json(
        { error: "Reward is not available" },
        { status: 400 },
      );
    }

    if (reward.stock <= 0) {
      return NextResponse.json(
        { error: "Reward is out of stock" },
        { status: 400 },
      );
    }

    // Find user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has enough points
    if (user.totalPoints < reward.points) {
      return NextResponse.json(
        {
          error: "Insufficient points",
          required: reward.points,
          current: user.totalPoints,
        },
        { status: 400 },
      );
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct points from user
      user.totalPoints -= reward.points;
      await user.save({ session });

      // Decrease reward stock
      reward.stock -= 1;
      await reward.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        userId: user._id,
        type: "redeem",
        amount: -reward.points,
        description: `Redeemed: ${reward.name}`,
        metadata: {
          rewardId: reward._id,
          rewardName: reward.name,
          rewardCategory: reward.category,
        },
      });
      await transaction.save({ session });

      await session.commitTransaction();

      console.log(
        `Redemption successful - User: ${user.email}, Reward: ${reward.name}`,
      );

      return NextResponse.json({
        success: true,
        message: "Reward redeemed successfully",
        newBalance: user.totalPoints,
        reward: {
          name: reward.name,
          description: reward.description,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json(
      { error: error.message || "Failed to redeem reward" },
      { status: 500 },
    );
  }
}
