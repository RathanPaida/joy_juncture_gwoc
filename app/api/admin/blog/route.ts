// app/api/admin/blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDb from '@/lib/mongodb';
import { Blog } from '@/models/Blog';
import { User } from '@/models/User';

async function verifyAdmin(token: string) {
  const decodedToken = await adminAuth.verifyIdToken(token);
  const firebaseUid = decodedToken.uid;
  
  await connectDb();
  const user = await User.findOne({ firebaseUid });
  
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'editor')) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return { 
    firebaseUid, 
    userEmail: decodedToken.email, 
    userName: user.name, 
    userRole: user.role 
  };
}

// GET - Fetch all blogs (admin can see all including drafts)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const { firebaseUid, userRole } = await verifyAdmin(token);

    await connectDb();
    
    // Admin/editor can see all blogs, viewers only see their own
    const query = (userRole === 'admin' || userRole === 'super_admin' || userRole === 'editor')
      ? {} 
      : { 'createdBy.userId': firebaseUid };
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      blogs: JSON.parse(JSON.stringify(blogs))
    });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

// POST - Create new blog
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    
    await connectDb();
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const blogData = await request.json();
    
    // Generate slug from title
    const slug = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = blogData.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    
    const blog = await Blog.create({
      ...blogData,
      slug,
      readTime,
      createdBy: {
        userId: firebaseUid,
        userName: user.name || decodedToken.email,
        userRole: user.role || 'viewer'
      },
      author: {
        name: user.name || decodedToken.email,
        avatar: user.avatar || null,
        role: user.role || 'viewer'
      },
      views: 0,
      likes: 0,
      comments: 0,
      publishedDate: blogData.status === 'published' ? new Date() : null
    });

    return NextResponse.json({
      success: true,
      blog: JSON.parse(JSON.stringify(blog))
    });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}