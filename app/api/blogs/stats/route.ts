// app/api/admin/blog/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import { Blog } from '@/models/Blog';

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    
    // Get statistics
    const totalBlogs = await Blog.countDocuments({});
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    const draftBlogs = await Blog.countDocuments({ status: 'draft' });
    const adminBlogs = await Blog.countDocuments({ 'createdBy.userRole': 'admin' });
    const userBlogs = await Blog.countDocuments({ 'createdBy.userRole': 'user' });
    
    // Calculate total views
    const viewsResult = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;
    
    return NextResponse.json({
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      adminBlogs,
      userBlogs,
      totalViews
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}