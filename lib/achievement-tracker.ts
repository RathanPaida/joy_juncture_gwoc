// lib/achievement-tracker.ts
import { connectDb } from "./mongodb";
import mongoose from "mongoose";

interface AchievementProgress {
  userId: string;
  achievementId: string;
  progress: number;
  unlocked: boolean;
}

export async function updateAchievementProgress(
  userId: string,
  activityType: string,
  incrementBy: number = 1,
) {
  try {
    await connectDb();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database not connected");

    // Get all active achievements for this activity type
    const achievements = await db
      .collection("achievements")
      .find({
        isActive: true,
        category: activityType,
      })
      .toArray();

    if (achievements.length === 0) {
      console.log(`No achievements found for activity type: ${activityType}`);
      return;
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (!user) throw new Error("User not found");

    // Initialize achievements array if doesn't exist
    if (!user.achievements) {
      user.achievements = [];
    }

    for (const achievement of achievements) {
      // Find or create user's progress for this achievement
      let userAchievement = user.achievements.find(
        (a: any) => a.achievementId?.toString() === achievement._id.toString(),
      );

      if (!userAchievement) {
        userAchievement = {
          achievementId: achievement._id,
          progress: 0,
          unlocked: false,
          unlockedAt: null,
        };
        user.achievements.push(userAchievement);
      }

      // Skip if already unlocked
      if (userAchievement.unlocked) continue;

      // Update progress
      userAchievement.progress = Math.min(
        userAchievement.progress + incrementBy,
        achievement.requirement,
      );

      // Check if unlocked
      if (
        userAchievement.progress >= achievement.requirement &&
        !userAchievement.unlocked
      ) {
        userAchievement.unlocked = true;
        userAchievement.unlockedAt = new Date();

        // Award points
        const pointsAwarded = achievement.points || 0;
        user.totalPoints = (user.totalPoints || 0) + pointsAwarded;

        // Create transaction for achievement unlock
        await db.collection("transactions").insertOne({
          userId: user._id,
          type: "achievement",
          amount: pointsAwarded,
          description: `Achievement Unlocked: ${achievement.name}`,
          metadata: {
            achievementId: achievement._id,
            achievementName: achievement.name,
          },
          createdAt: new Date(),
        });

        console.log(
          `🏆 Achievement unlocked: ${achievement.name} (+${pointsAwarded} points)`,
        );
      }
    }

    // Update user document
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          achievements: user.achievements,
          totalPoints: user.totalPoints,
          lastActivity: new Date(),
        },
      },
    );

    return user.achievements;
  } catch (error: any) {
    console.error("❌ Error updating achievement progress:", error);
    throw error;
  }
}

// Helper function to check achievements for a user
export async function checkUserAchievements(userId: string) {
  try {
    await connectDb();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database not connected");

    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) throw new Error("User not found");

    // Get all active achievements
    const achievements = await db
      .collection("achievements")
      .find({ isActive: true })
      .toArray();

    // Map user's progress to achievements
    const userAchievements = achievements.map((achievement) => {
      const userProgress = user.achievements?.find(
        (a: any) => a.achievementId?.toString() === achievement._id.toString(),
      );

      return {
        _id: achievement._id.toString(),
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        requirement: achievement.requirement,
        category: achievement.category,
        isActive: true,
        unlocked: userProgress?.unlocked || false,
        progress: userProgress?.progress || 0,
        unlockedAt: userProgress?.unlockedAt || null,
      };
    });

    return userAchievements;
  } catch (error: any) {
    console.error("❌ Error checking achievements:", error);
    throw error;
  }
}
