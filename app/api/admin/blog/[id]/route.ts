// app/api/admin/blog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// PUT - Update blog with image upload
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;

    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    console.log(
      "PUT /api/admin/blog/[id] - User:",
      firebaseUid,
      "Blog ID:",
      params.id,
    );

    await connectDb();

    // Find the blog
    const blog = await Blog.findById(params.id);
    if (!blog) {
      console.log("Blog not found:", params.id);
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 },
      );
    }

    console.log("Found blog, checking permissions...");
    console.log("Blog createdBy:", blog.createdBy.userId);
    console.log("Current user:", firebaseUid);

    // Check permissions
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found in database" },
        { status: 403 },
      );
    }

    const isAdmin = ["admin", "super_admin", "editor"].includes(user.role);
    const isOwner = blog.createdBy.userId === firebaseUid;

    console.log("Permission check:", { isAdmin, isOwner, userRole: user.role });

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to edit this blog" },
        { status: 403 },
      );
    }

    // Parse FormData for image upload
    const formData = await request.formData();
    const blogDataStr = formData.get('blogData') as string;
    const imageFile = formData.get('coverImage') as File | null;

    if (!blogDataStr) {
      return NextResponse.json(
        { success: false, error: 'Blog data is required' },
        { status: 400 }
      );
    }

    const updateData = JSON.parse(blogDataStr);
    let coverImageUrl = updateData.coverImage || blog.coverImage || '';

    // Handle image upload if provided
    if (imageFile) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'blogs');

      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = imageFile.name.split('.').pop();
      const filename = `${generateUniqueId()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      coverImageUrl = `/uploads/blogs/${filename}`;
    }

    console.log("Update data received:", Object.keys(updateData));

    // Update slug if title changed
    if (updateData.title && updateData.title !== blog.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      console.log("Generated new slug:", updateData.slug);
    }

    // Recalculate read time if content changed
    if (updateData.content) {
      const wordCount = updateData.content.split(/\s+/).length;
      updateData.readTime = Math.ceil(wordCount / 200);
      console.log("Calculated read time:", updateData.readTime, "minutes");
    }

    // Update published date if status changed to published
    if (updateData.status === "published" && blog.status !== "published") {
      updateData.publishedDate = new Date();
      console.log("Setting published date");
    }

    // Apply updates
    Object.assign(blog, updateData);
    blog.coverImage = coverImageUrl;
    blog.updatedAt = new Date();

    await blog.save();
    console.log("Blog updated successfully:", blog._id);

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
      blog: JSON.parse(JSON.stringify(blog)),
    });
  } catch (error: any) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete blog
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;

    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    console.log(
      "DELETE /api/admin/blog/[id] - User:",
      firebaseUid,
      "Blog ID:",
      params.id,
    );

    await connectDb();

    // Find the blog
    const blog = await Blog.findById(params.id);
    if (!blog) {
      console.log("Blog not found:", params.id);
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 },
      );
    }

    console.log("Found blog, checking permissions...");
    console.log("Blog createdBy:", blog.createdBy.userId);
    console.log("Current user:", firebaseUid);

    // Check permissions
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found in database" },
        { status: 403 },
      );
    }

    const isAdmin = ["admin", "super_admin"].includes(user.role);
    const isOwner = blog.createdBy.userId === firebaseUid;

    console.log("Permission check:", { isAdmin, isOwner, userRole: user.role });

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this blog" },
        { status: 403 },
      );
    }

    // Delete the blog
    await Blog.findByIdAndDelete(params.id);
    console.log("Blog deleted successfully:", params.id);

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}