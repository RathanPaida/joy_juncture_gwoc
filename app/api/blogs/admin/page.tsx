import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '@/models/Blog';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    // Check if user is editor (can only see their own posts)
    if (token.role === 'editor') {
      // Convert string userId to ObjectId for comparison
      query.createdBy = new mongoose.Types.ObjectId(token.userId as string);
    }
    
    // Get total count
    const total = await Blog.countDocuments(query);
    
    // Get blogs with pagination
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email')
      .lean();
    
    // Convert ObjectIds to strings for frontend
    const formattedBlogs = blogs.map(blog => ({
      ...blog,
      _id: blog._id.toString(),
      createdBy: blog.createdBy ? {
        ...blog.createdBy,
        _id: blog.createdBy._id.toString()
      } : null,
      lastEditedBy: blog.lastEditedBy ? {
        ...blog.lastEditedBy,
        _id: blog.lastEditedBy._id.toString()
      } : null
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: formattedBlogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}