// app/api/wallet/achievements/route.ts - UPDATED WITH TRACKING
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { checkUserAchievements } from "@/lib/achievement-tracker";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    console.log("=== PUBLIC: Fetching User Achievements ===");

    await connectDb();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not connected",
          achievements: [],
        },
        { status: 500 },
      );
    }

    // Check for authentication
    let userId = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await verifyIdToken(token);
        console.log("Token verified for user:", decodedToken.email);

        // Find user
        const user = await db.collection("users").findOne({
          $or: [
            { firebaseUid: decodedToken.uid },
            { email: decodedToken.email?.toLowerCase() },
          ],
        });

        if (user) {
          userId = user._id.toString();
          console.log("User found:", user.email);

          // Get achievements with user progress
          const achievements = await checkUserAchievements(userId);

          return NextResponse.json({
            success: true,
            achievements,
          });
        }
      } catch (authError) {
        console.log("⚠️ Auth token invalid, returning public achievements");
      }
    }

    // If no auth or user not found, return all active achievements without progress
    const achievements = await db
      .collection("achievements")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    const achievementsJSON = achievements.map((a) => ({
      _id: a._id.toString(),
      name: a.name,
      description: a.description,
      icon: a.icon || "FaTrophy",
      points: a.points,
      requirement: a.requirement || 1,
      category: a.category || "general",
      isActive: true,
      unlocked: false,
      progress: 0,
    }));

    return NextResponse.json({
      success: true,
      achievements: achievementsJSON,
    });
  } catch (error: any) {
    console.error("❌ Error fetching achievements:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch achievements",
        achievements: [],
      },
      { status: 500 },
    );
  }
}
