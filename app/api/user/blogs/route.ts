// app/api/user/blogs/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Blog } from "@/models/Blog";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Fetch user's blogs from MongoDB
    const blogs = await Blog.find({ "createdBy.userId": userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      blogs: JSON.parse(JSON.stringify(blogs)),
      count: blogs.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching user blogs:", error);

    // Return empty array on error
    return NextResponse.json({
      success: true,
      blogs: [],
      count: 0,
    });
  }
}
