// app/api/admin/blog/stats/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    await connectDb();

    // Get blogs collection
    const blogsCollection = mongoose.connection.collection("blogs");

    // Calculate stats
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      adminBlogs,
      userBlogs,
    ] = await Promise.all([
      blogsCollection.countDocuments(),
      blogsCollection.countDocuments({ status: "published" }),
      blogsCollection.countDocuments({ status: "draft" }),
      blogsCollection.countDocuments({
        "createdBy.userRole": { $in: ["admin", "super_admin", "editor"] }
      }),
      blogsCollection.countDocuments({
        "createdBy.userRole": "user"
      }),
    ]);

    // Calculate total views (if you have a views field)
    const viewsAggregation = await blogsCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" }
          }
        }
      ])
      .toArray();

    const totalViews = viewsAggregation[0]?.totalViews || 0;

    const stats = {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      adminBlogs,
      userBlogs,
      totalViews,
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error("Error fetching blog stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}