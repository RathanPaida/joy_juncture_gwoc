// app/api/blogs/like/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
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

    const { blogId, action } = await request.json();

    if (!blogId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDb();

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 },
      );
    }

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({
        firebaseUid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        authProvider: "firebase",
        likedBlogs: [],
        bookmarkedBlogs: [],
      });
    }

    if (action === "like") {
      if (!user.likedBlogs.includes(blogId)) {
        user.likedBlogs.push(blogId);
        blog.likes += 1;
      }
    } else if (action === "unlike") {
      user.likedBlogs = user.likedBlogs.filter((id: string) => id !== blogId);
      blog.likes = Math.max(0, blog.likes - 1);
    }

    await user.save();
    await blog.save();

    return NextResponse.json({
      success: true,
      likes: blog.likes,
      action,
    });
  } catch (error: any) {
    console.error("Error handling like:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
