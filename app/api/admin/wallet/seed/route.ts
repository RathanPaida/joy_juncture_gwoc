// app/api/admin/wallet/seed/route.ts
// Use this ONCE to populate initial sample data
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  name: String,
  description: String,
  points: Number,
  category: String,
  icon: String,
  color: String,
  stock: Number,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const achievementSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  points: Number,
  requirement: Number,
  category: String,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);
const Achievement =
  mongoose.models.Achievement ||
  mongoose.model("Achievement", achievementSchema);

const sampleRewards = [
  {
    name: "10% Discount Code",
    description: "Get 10% off your next purchase",
    points: 100,
    category: "discount",
    icon: "FaGift",
    color: "#4ECDC4",
    stock: 100,
    isActive: true,
  },
  {
    name: "25% Discount Code",
    description: "Save 25% on any game in our store",
    points: 250,
    category: "discount",
    icon: "FaShoppingCart",
    color: "#3498DB",
    stock: 50,
    isActive: true,
  },
  {
    name: "Free Event Ticket",
    description: "Complimentary ticket to any upcoming game night",
    points: 500,
    category: "ticket",
    icon: "FaCalendarAlt",
    color: "#9B59B6",
    stock: 30,
    isActive: true,
  },
  {
    name: "Board Game Bundle",
    description: "Get 3 classic board games at no cost",
    points: 1000,
    category: "bundle",
    icon: "FaGamepad",
    color: "#FFCC00",
    stock: 20,
    isActive: true,
  },
  {
    name: "Premium Membership (1 Month)",
    description: "Access exclusive games and early event registration",
    points: 750,
    category: "premium",
    icon: "FaCrown",
    color: "#FF8C00",
    stock: 25,
    isActive: true,
  },
  {
    name: "Mystery Gift Box",
    description: "Random gaming merchandise and surprises",
    points: 1500,
    category: "bundle",
    icon: "FaGem",
    color: "#E74C3C",
    stock: 15,
    isActive: true,
  },
];

const sampleAchievements = [
  {
    name: "First Steps",
    description: "Make your first purchase",
    icon: "FaStar",
    points: 50,
    requirement: 1,
    category: "beginner",
    isActive: true,
  },
  {
    name: "Social Butterfly",
    description: "Attend 5 events",
    icon: "FaUsers",
    points: 200,
    requirement: 5,
    category: "social",
    isActive: true,
  },
  {
    name: "Game Master",
    description: "Complete 10 online challenges",
    icon: "FaGamepad",
    points: 300,
    requirement: 10,
    category: "gameplay",
    isActive: true,
  },
  {
    name: "Dedicated Player",
    description: "Maintain a 7-day streak",
    icon: "FaFire",
    points: 150,
    requirement: 7,
    category: "streak",
    isActive: true,
  },
  {
    name: "Big Spender",
    description: "Spend ₹10,000 in the store",
    icon: "FaShoppingCart",
    points: 500,
    requirement: 10000,
    category: "shopping",
    isActive: true,
  },
  {
    name: "Legendary",
    description: "Reach Level 5",
    icon: "FaCrown",
    points: 1000,
    requirement: 5,
    category: "level",
    isActive: true,
  },
];

export async function POST(req: NextRequest) {
  try {
    console.log("=== Seeding Database with Sample Data ===");

    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();

    // Check if data already exists
    const existingRewards = await Reward.countDocuments();
    const existingAchievements = await Achievement.countDocuments();

    if (existingRewards > 0 || existingAchievements > 0) {
      return NextResponse.json(
        {
          message: "Database already contains data. Skipping seed.",
          existingRewards,
          existingAchievements,
        },
        { status: 400 },
      );
    }

    // Insert sample rewards
    const rewards = await Reward.insertMany(sampleRewards);
    console.log(`Created ${rewards.length} sample rewards`);

    // Insert sample achievements
    const achievements = await Achievement.insertMany(sampleAchievements);
    console.log(`Created ${achievements.length} sample achievements`);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      created: {
        rewards: rewards.length,
        achievements: achievements.length,
      },
      data: {
        rewards: rewards.map((r) => ({ id: r._id, name: r.name })),
        achievements: achievements.map((a) => ({ id: a._id, name: a.name })),
      },
    });
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("=== Clearing All Wallet Data ===");

    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 },
      );
    }

    await connectDb();

    // Delete all rewards and achievements
    const deletedRewards = await Reward.deleteMany({});
    const deletedAchievements = await Achievement.deleteMany({});

    console.log(`Deleted ${deletedRewards.deletedCount} rewards`);
    console.log(`Deleted ${deletedAchievements.deletedCount} achievements`);

    return NextResponse.json({
      success: true,
      message: "All wallet data cleared",
      deleted: {
        rewards: deletedRewards.deletedCount,
        achievements: deletedAchievements.deletedCount,
      },
    });
  } catch (error: any) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { error: "Failed to clear data", details: error.message },
      { status: 500 },
    );
  }
}
