// app/api/debug/fix-discussions/route.ts - RUN THIS ONCE TO FIX DATABASE
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    if (!mongoose.connection.db) {
      throw new Error('Database not connected');
    }

    const Discussion = mongoose.connection.db.collection('discussions');

    console.log('🔧 Starting discussion schema migration...');

    // Get all discussions
    const discussions = await Discussion.find({}).toArray();
    console.log(`📊 Found ${discussions.length} discussions`);

    let fixedCount = 0;
    const updates = [];

    for (const discussion of discussions) {
      const fixes: any = {};

      // Fix replies field - should be array
      if (typeof discussion.replies !== 'object' || !Array.isArray(discussion.replies)) {
        fixes.replies = [];
        console.log(`✅ Fixed replies for: ${discussion.title}`);
      }

      // Fix likedBy field - should be array
      if (!Array.isArray(discussion.likedBy)) {
        fixes.likedBy = [];
      }

      // Fix likes field - should be number
      if (typeof discussion.likes !== 'number') {
        fixes.likes = 0;
      }

      // Fix viewCount field - should be number
      if (typeof discussion.viewCount !== 'number') {
        fixes.viewCount = 0;
      }

      // Fix isHot field - should be boolean
      if (typeof discussion.isHot !== 'boolean') {
        fixes.isHot = false;
      }

      // Fix isPinned field - should be boolean
      if (typeof discussion.isPinned !== 'boolean') {
        fixes.isPinned = false;
      }

      // Fix tags field - should be array
      if (!Array.isArray(discussion.tags)) {
        fixes.tags = [];
      }

      // Fix status field - should be string
      if (!discussion.status) {
        fixes.status = 'active';
      }

      // Apply fixes if needed
      if (Object.keys(fixes).length > 0) {
        await Discussion.updateOne(
          { _id: discussion._id },
          { $set: fixes }
        );
        fixedCount++;
        updates.push({
          id: discussion._id,
          title: discussion.title,
          fixes: Object.keys(fixes)
        });
      }
    }

    console.log(`✅ Migration complete! Fixed ${fixedCount} discussions`);

    return NextResponse.json({
      success: true,
      message: `Migration complete! Fixed ${fixedCount} of ${discussions.length} discussions`,
      total: discussions.length,
      fixed: fixedCount,
      updates: updates
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}