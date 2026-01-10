// app/api/admin/wallet/debug/route.ts
// CREATE THIS FILE TO DEBUG MONGODB
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    // Get the raw MongoDB connection
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 },
      );
    }

    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log("📋 All collections:", collectionNames);

    // Check rewards collection
    let rewardsData = null;
    let rewardsCount = 0;

    if (collectionNames.includes("rewards")) {
      rewardsCount = await db.collection("rewards").countDocuments();
      rewardsData = await db.collection("rewards").find({}).limit(5).toArray();
      console.log(
        "✅ Found rewards collection with",
        rewardsCount,
        "documents",
      );
    }

    // Try to delete using raw MongoDB
    const testId = "695ec27307ac52b1034fb778";
    console.log("🧪 Testing delete with raw MongoDB...");

    const deleteTest = await db.collection("rewards").deleteOne({
      _id: new mongoose.Types.ObjectId(testId),
    });

    console.log("Delete test result:", deleteTest);

    return NextResponse.json({
      allCollections: collectionNames,
      rewardsCollection: {
        exists: collectionNames.includes("rewards"),
        count: rewardsCount,
        sampleData: rewardsData,
      },
      deleteTest: {
        testId,
        acknowledged: deleteTest.acknowledged,
        deletedCount: deleteTest.deletedCount,
      },
      mongooseModels: Object.keys(mongoose.models),
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
