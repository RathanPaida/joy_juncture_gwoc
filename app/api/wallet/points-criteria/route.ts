// app/api/wallet/points-criteria/route.ts - FIXED WITH CORRECT COLLECTION NAME
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    console.log("=== PUBLIC: Fetching Active Points Criteria ===");

    await connectDb();
    const db = mongoose.connection.db;

    if (!db) {
      console.error("❌ Database not connected");
      return NextResponse.json(
        {
          success: false,
          error: "Database not connected",
          criteria: [],
        },
        { status: 500 },
      );
    }

    // Correct collection name is 'pointscriterias' (with 's' at the end)
    const criteria = await db
      .collection("pointscriterias")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(
      `✅ Found ${criteria.length} active criteria in pointscriterias collection`,
    );

    // Convert to JSON-safe format
    const criteriaJSON = criteria.map((c) => ({
      _id: c._id.toString(),
      type: c.type,
      pointsPerUnit: c.pointsPerUnit,
      description: c.description,
      isActive: c.isActive !== false,
    }));

    return NextResponse.json({
      success: true,
      criteria: criteriaJSON,
      count: criteriaJSON.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching criteria:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch criteria",
        details: error.message,
        criteria: [],
      },
      { status: 500 },
    );
  }
}
