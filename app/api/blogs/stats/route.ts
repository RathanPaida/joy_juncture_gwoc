// app/api/blogs/stats/route.ts
import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import { Blog } from '@/models/Blog';

export async function GET() {
  try {
    await connectDb();
    
    const totalBlogs = await Blog.countDocuments({});
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    
    const stats = await Blog.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      totalBlogs,
      publishedBlogs,
      totalViews: stats[0]?.totalViews || 0,
      totalLikes: stats[0]?.totalLikes || 0
    });
  } catch (error: any) {
    console.error('Error fetching blogs stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}