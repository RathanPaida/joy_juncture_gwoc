// lib/streak-manager.ts
import { connectDb } from "./mongodb";
import mongoose from "mongoose";

export async function updateUserStreak(userId: string) {
  try {
    await connectDb();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database not connected");

    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) throw new Error("User not found");

    const now = new Date();
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;

    let newStreak = user.streak || 0;

    if (!lastActivity) {
      // First time login
      newStreak = 1;
    } else {
      // Calculate days difference
      const daysDiff = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 0) {
        // Same day - no change
        newStreak = user.streak || 1;
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak = (user.streak || 0) + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }
    }

    // Calculate bonus points for streak milestones
    let bonusPoints = 0;
    if (newStreak % 7 === 0) {
      // Weekly streak bonus
      bonusPoints = 50;
    } else if (newStreak % 30 === 0) {
      // Monthly streak bonus
      bonusPoints = 200;
    } else if (newStreak > 1) {
      // Daily consecutive login bonus
      bonusPoints = 10;
    }

    // Update user
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          streak: newStreak,
          lastActivity: now,
        },
        $inc: {
          totalPoints: bonusPoints,
        },
      },
    );

    // Add transaction for bonus points if any
    if (bonusPoints > 0) {
      await db.collection("transactions").insertOne({
        userId: user._id,
        type: "bonus",
        amount: bonusPoints,
        description: `${newStreak} day streak bonus!`,
        metadata: {
          streakDays: newStreak,
          bonusType: "streak",
        },
        createdAt: now,
      });
    }

    console.log(
      `✅ Streak updated: ${newStreak} days (+${bonusPoints} points)`,
    );

    return {
      streak: newStreak,
      bonusPoints,
      totalPoints: (user.totalPoints || 0) + bonusPoints,
    };
  } catch (error: any) {
    console.error("❌ Error updating streak:", error);
    throw error;
  }
}
