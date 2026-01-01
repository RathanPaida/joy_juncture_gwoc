import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '../../../../models/Blog';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if ID is a valid ObjectId (for ID) or try as slug
    let blog;
    
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      blog = await Blog.findById(params.id).lean();
    } else {
      // Try as slug
      blog = await Blog.findOne({ slug: params.id }).lean();
    }
    
    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Increment views (optional)
    // await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
    
    return NextResponse.json({
      success: true,
      data: blog
    });
    
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const token = await getToken({ req: request });
    
    if (!token || !['admin', 'editor'].includes(token.role as string)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const body = await request.json();
    
    // Check if blog exists
    const existingBlog = await Blog.findById(params.id);
    if (!existingBlog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Check if slug already exists (if changed)
    if (body.slug && body.slug !== existingBlog.slug) {
      const slugExists = await Blog.findOne({ slug: body.slug, _id: { $ne: params.id } });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update blog
    const updatedData = {
      ...body,
      lastEditedBy: token.userId,
      updatedAt: new Date()
    };
    
    const blog = await Blog.findByIdAndUpdate(
      params.id,
      updatedData,
      { new: true, runValidators: true }
    ).lean();
    
    return NextResponse.json({
      success: true,
      data: blog,
      message: 'Blog updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating blog:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update blog' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication - only admins can delete
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Check if blog exists
    const blog = await Blog.findById(params.id);
    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Soft delete (change status to archived)
    await Blog.findByIdAndUpdate(params.id, { status: 'archived' });
    
    // OR hard delete:
    // await Blog.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog' },
      { status: 500 }
    );
  }
}