import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '../../../models/Blog';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const featured = searchParams.get('featured');
    const status = searchParams.get('status') || 'published';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = { status };
    
    if (category) {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Get total count for pagination
    const total = await Blog.countDocuments(query);
    
    // Get blogs with pagination
    const blogs = await Blog.find(query)
      .sort({ publishedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content')
      .lean();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: blogs,
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
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    const requiredFields = ['title', 'content', 'category', 'author'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if slug already exists
    if (body.slug) {
      const existingBlog = await Blog.findOne({ slug: body.slug });
      if (existingBlog) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Create blog post
    const blogData = {
      ...body,
      author: typeof body.author === 'string' ? { name: body.author, role: 'Author' } : body.author,
      createdBy: token.userId,
      lastEditedBy: token.userId,
      status: body.status || 'published'
    };
    
    const blog = new Blog(blogData);
    await blog.save();
    
    return NextResponse.json({
      success: true,
      data: blog,
      message: 'Blog created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating blog:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create blog' },
      { status: 500 }
    );
  }
}