// app/api/admin/blog/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    await connectDb();

    const user = await User.findOne({ firebaseUid });
    if (
      !user ||
      (user.role !== "admin" &&
        user.role !== "super_admin" &&
        user.role !== "editor")
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const totalBlogs = await Blog.countDocuments({});
    const publishedBlogs = await Blog.countDocuments({ status: "published" });
    const draftBlogs = await Blog.countDocuments({ status: "draft" });
    const adminBlogs = await Blog.countDocuments({
      "createdBy.userRole": { $in: ["admin", "super_admin", "editor"] },
    });
    const userBlogs = await Blog.countDocuments({
      "createdBy.userRole": "viewer",
    });

    // Aggregate total views
    const viewsAggregate = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
        },
      },
    ]);

    const totalViews = viewsAggregate[0]?.totalViews || 0;

    return NextResponse.json({
      success: true,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews,
      adminBlogs,
      userBlogs,
    });
  } catch (error: any) {
    console.error("Error fetching admin blog stats:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
