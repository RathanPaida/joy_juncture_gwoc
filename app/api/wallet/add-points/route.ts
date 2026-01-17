export const dynamic = 'force-dynamic';
// app/api/wallet/add-points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";

// Helper function to check achievements
async function checkAchievements(userId: string, type: string, metadata?: any) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const achievements = user.achievements || [];

    switch (type) {
      case "purchase":
        // First purchase achievement
        const purchaseAchievement = achievements.find(
          (a: { achievementId: string }) =>
            a.achievementId === "first_purchase",
        );
        if (!purchaseAchievement?.unlocked) {
          // Unlock first purchase achievement
          user.achievements.push({
            achievementId: "first_purchase",
            unlocked: true,
            progress: 1,
            unlockedAt: new Date(),
          });
        }
        break;

      case "event":
        // Event attendance achievement
        const eventCount = achievements
          .filter(
            (a: { achievementId: string }) =>
              a.achievementId === "event_regular",
          )
          .reduce(
            (sum: any, a: { progress: any }) => sum + (a.progress || 0),
            0,
          );

        if (eventCount < 5) {
          const eventAchievement = achievements.find(
            (a: { achievementId: string }) =>
              a.achievementId === "event_regular",
          );
          if (eventAchievement) {
            eventAchievement.progress = (eventAchievement.progress || 0) + 1;
            if (eventAchievement.progress >= 5) {
              eventAchievement.unlocked = true;
              eventAchievement.unlockedAt = new Date();
            }
          } else {
            user.achievements.push({
              achievementId: "event_regular",
              unlocked: false,
              progress: 1,
            });
          }
        }
        break;

      case "daily":
        // Streak achievement
        if (user.streak >= 7) {
          const streakAchievement = achievements.find(
            (a: { achievementId: string }) =>
              a.achievementId === "streak_champion",
          );
          if (!streakAchievement?.unlocked) {
            user.achievements.push({
              achievementId: "streak_champion",
              unlocked: true,
              progress: user.streak,
              unlockedAt: new Date(),
            });
          }
        }
        break;
    }

    await user.save();
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const body = await req.json();
    const { type, amount, description, referenceId, metadata } = body;

    // Validate required fields
    if (!type || amount === undefined || !description) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount, description" },
        { status: 400 },
      );
    }

    // Validate amount is a number
    const pointsAmount = Number(amount);
    if (isNaN(pointsAmount)) {
      return NextResponse.json(
        { error: "Amount must be a valid number" },
        { status: 400 },
      );
    }

    let user;
    const authHeader = req.headers.get("authorization");

    // Try Firebase auth first
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await verifyIdToken(token);
        user = await User.findOne({ firebaseUid: decodedToken.uid });
      } catch (firebaseError) {
        console.error("Firebase token verification failed:", firebaseError);
      }
    }

    // If no Firebase user, try session
    if (!user) {
      const sessionToken = req.cookies.get("session")?.value;
      if (sessionToken) {
        // Implement your session logic here
        // For example, you might have a session service
        // user = await getUserFromSession(sessionToken);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Update user points
    user.totalPoints = (user.totalPoints || 0) + pointsAmount;

    // Update streak for daily activities
    if (type === "daily") {
      const today = new Date();
      const lastActivity = user.lastActivity
        ? new Date(user.lastActivity)
        : new Date();
      const diffTime = today.getTime() - lastActivity.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak = (user.streak || 0) + 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
      user.lastActivity = today;
    } else {
      // Update last activity for any point addition
      user.lastActivity = new Date();
    }

    // Update user level based on points
    const newLevel = Math.max(1, Math.floor(user.totalPoints / 1000) + 1);
    if (newLevel > user.level) {
      user.level = newLevel;
    }

    // Save user first
    await user.save();

    // Get user ID safely - FIXED HERE
    const userId = user._id?.toString();
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: userId,
      type,
      amount: pointsAmount,
      description,
      referenceId,
      metadata,
      balanceAfter: user.totalPoints,
      status: "completed",
    });

    await transaction.save();

    // Check achievements
    await checkAchievements(userId, type, metadata);

    return NextResponse.json(
      {
        success: true,
        newBalance: user.totalPoints,
        transactionId: transaction._id,
        user: {
          totalPoints: user.totalPoints,
          level: user.level,
          streak: user.streak,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error adding points:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
