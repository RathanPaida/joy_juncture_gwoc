// app/api/admin/blog/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Force dynamic rendering - must be at the top level
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// PUT - Update blog with image upload
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error("Token verification failed:", authError);
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;

    console.log(
      "PUT /api/admin/blog/[id] - User:",
      firebaseUid,
      "Blog ID:",
      id,
    );

    await connectDb();

    // Find the blog
    const blog = await Blog.findById(id);
    if (!blog) {
      console.log("Blog not found:", id);
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
    const coverImageFile = formData.get('coverImage') as File | null;
    const additionalImages = formData.getAll('images') as File[];

    if (!blogDataStr) {
      return NextResponse.json(
        { success: false, error: 'Blog data is required' },
        { status: 400 }
      );
    }

    const updateData = JSON.parse(blogDataStr);
    let coverImageUrl = updateData.coverImage || blog.coverImage || '';

    // Start with existing images (ensure it's an array)
    const currentImages = updateData.images || blog.images || [];
    const newImageUrls: string[] = [];

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'blogs');

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    // Handle Cover Image Update
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        const bytes = await coverImageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = coverImageFile.name.split('.').pop();
        const filename = `${generateUniqueId()}_cover.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);
        coverImageUrl = `/uploads/blogs/${filename}`;
      } catch (fileError) {
        console.error("Error saving cover image:", fileError);
      }
    }

    // Handle Additional Images Upload
    if (additionalImages && additionalImages.length > 0) {
      for (const imgFile of additionalImages) {
        if (imgFile instanceof File && imgFile.size > 0) {
          try {
            const bytes = await imgFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const ext = imgFile.name.split('.').pop();
            const filename = `${generateUniqueId()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
            const filepath = path.join(uploadsDir, filename);

            await writeFile(filepath, buffer);
            newImageUrls.push(`/uploads/blogs/${filename}`);
          } catch (fileError) {
            console.error("Error saving additional image:", fileError);
          }
        }
      }
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
    // Merge new images with preserved existing ones
    // Note: updateData.images comes from frontend and should contain the list of retained existing images
    // We add newly uploaded images to that list.
    blog.images = [...(updateData.images || []), ...newImageUrls];

    blog.updatedAt = new Date();

    await blog.save();
    console.log("Blog updated successfully:", blog._id);

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
      blog: JSON.parse(JSON.stringify(blog)),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error("Token verification failed:", authError);
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;

    console.log(
      "DELETE /api/admin/blog/[id] - User:",
      firebaseUid,
      "Blog ID:",
      id,
    );

    await connectDb();

    // Find the blog
    const blog = await Blog.findById(id);
    if (!blog) {
      console.log("Blog not found:", id);
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
    await Blog.findByIdAndDelete(id);
    console.log("Blog deleted successfully:", id);

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}