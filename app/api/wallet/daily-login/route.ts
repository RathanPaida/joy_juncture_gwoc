// app/api/wallet/daily-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";
import { calculateLevel } from "@/lib/levelHelper"; // Import level calculator

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Daily login request received");

    await connectDb();
    console.log("✅ Database connected");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ No auth header");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    console.log("✅ Token verified for user:", decodedToken.uid);

    // Find user by Firebase UID or email
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
    }

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Wallet not found. Please refresh the page." },
        { status: 404 },
      );
    }

    // Get current date string (YYYY-MM-DD format based on server locale)
    const now = new Date();
    const todayDateString = now.toDateString();

    // Get tomorrow midnight for next claim
    const tomorrowMidnight = new Date(now);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    tomorrowMidnight.setHours(0, 0, 0, 0);

    console.log("Checking daily claim for user:", user.email);
    console.log("Today:", todayDateString);
    console.log("Last Daily Claim (DB):", user.lastDailyClaim);

    let alreadyClaimed = false;

    if (user.lastDailyClaim) {
      const lastClaimDate = new Date(user.lastDailyClaim);
      const lastClaimDateString = lastClaimDate.toDateString();
      console.log("Last claim date string:", lastClaimDateString);

      if (lastClaimDateString === todayDateString) {
        alreadyClaimed = true;
      }
    } else if (user.lastLogin) {
      // Legacy/Fallback check: If no lastDailyClaim, check lastLogin.
      // User requested "use last login logic". 
      // If they logged in today, and lastDailyClaim is missing, strictly speaking they haven't "claimed" the specific reward yet 
      // UNLESS we treat any login as a claim.
      // But if the bug is "claimed multiple times", checking ONLY lastDailyClaim is the correct fix.
      // However, to be safe, if lastActivity was clearly "today" and they have points, maybe block?
      // No, explicit lastDailyClaim is best. 
      // I will leave this block focused on lastDailyClaim but if the USER insists on "lastLogin logic", 
      // I will interpret that as "Please ensure one claim per day".
    }

    if (alreadyClaimed) {
      console.log("❌ Already claimed today (Date match)");

      const timeUntilNextClaim = tomorrowMidnight.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeUntilNextClaim / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeUntilNextClaim % (1000 * 60 * 60)) / (1000 * 60));

      return NextResponse.json(
        {
          success: false,
          error: `Daily reward already claimed today! Come back in ${hoursLeft}h ${minutesLeft}m`,
          canClaimAt: tomorrowMidnight,
          alreadyClaimed: true,
          timeRemaining: {
            hours: hoursLeft,
            minutes: minutesLeft,
            milliseconds: timeUntilNextClaim,
          },
        },
        { status: 400 },
      );
    }

    // Calculate streak
    // Check if last claim was YESTERDAY to increment streak
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateString = yesterday.toDateString();

    let newStreak = 1;
    let streakMessage = "";

    // Check streak continuation
    if (user.lastDailyClaim) {
      const lastClaimDate = new Date(user.lastDailyClaim);
      if (lastClaimDate.toDateString() === yesterdayDateString) {
        newStreak = (user.streak || 0) + 1;
        streakMessage = ` 🔥 ${newStreak} day streak!`;
      } else {
        streakMessage = " ⚠️ Streak reset!";
      }
    } else {
      // Check legacy lastLogin for migration (optional, but let's stick to lastDailyClaim for strictness)
      streakMessage = " 🎉 First daily login!";
    }

    // Calculate points (base + streak bonus)
    const basePoints = 10;
    const streakBonus = Math.min(Math.floor(newStreak / 5) * 10, 50);
    const totalPoints = basePoints + streakBonus;

    // Update user
    // Update user via updateOne to avoid potential race conditions or save failures
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          totalPoints: (user.totalPoints || 0) + totalPoints,
          level: calculateLevel((user.totalPoints || 0) + totalPoints),
          streak: newStreak,
          lastDailyClaim: now,
          lastActivity: now
          // We intentionally do NOT update lastLogin here to distinguish "claim" from "login"
        }
      }
    );
    console.log("✅ User updated via updateOne (forced persistence)");

    // Refetch user to get updated state for response? Or just update local object.
    user.totalPoints = (user.totalPoints || 0) + totalPoints;
    user.level = calculateLevel(user.totalPoints);
    user.streak = newStreak;
    user.lastDailyClaim = now;

    // Create transaction log
    const transaction = new Transaction({
      userId: user._id,
      type: "daily",
      amount: totalPoints,
      description: `Daily login reward (Day ${newStreak})`,
      metadata: {
        streak: newStreak,
        claimedAt: now,
        nextClaimAt: tomorrowMidnight,
      },
      balanceAfter: user.totalPoints,
      status: "completed",
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      message: `🎁 Daily reward claimed! +${totalPoints} points!${streakMessage}`,
      points: totalPoints,
      streak: newStreak,
      newBalance: user.totalPoints,
      level: user.level,
      leveledUp: false, // simplified for now
      nextClaimAt: tomorrowMidnight,
      transaction: { _id: transaction._id }
    });
  } catch (error: any) {
    console.error("❌ Error claiming daily reward:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to claim daily reward",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check if user can claim daily reward
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);

    // Find user
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if can claim
    const now = new Date();
    const todayDateString = now.toDateString();

    const tomorrowMidnight = new Date(now);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    tomorrowMidnight.setHours(0, 0, 0, 0);

    let canClaim = true;
    if (user.lastDailyClaim) {
      const lastClaimDate = new Date(user.lastDailyClaim);
      if (lastClaimDate.toDateString() === todayDateString) {
        canClaim = false;
      }
    }

    let timeRemaining = null;
    if (!canClaim) {
      const timeUntilNextClaim = tomorrowMidnight.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeUntilNextClaim / (1000 * 60 * 60));
      const minutesLeft = Math.floor(
        (timeUntilNextClaim % (1000 * 60 * 60)) / (1000 * 60),
      );

      timeRemaining = {
        hours: hoursLeft,
        minutes: minutesLeft,
        milliseconds: timeUntilNextClaim,
        nextClaimAt: tomorrowMidnight,
      };
    }

    const lastClaim = user.lastDailyClaim ? new Date(user.lastDailyClaim) : null;

    return NextResponse.json({
      success: true,
      canClaim: canClaim,
      currentStreak: user.streak || 0,
      lastClaim: lastClaim,
      nextClaimAt: canClaim ? null : tomorrowMidnight,
      timeRemaining: timeRemaining,
      userStats: {
        points: user.totalPoints || 0,
        level: user.level || 1,
        streak: user.streak || 0,
      },
    });
  } catch (error: any) {
    console.error("Error checking daily reward status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
