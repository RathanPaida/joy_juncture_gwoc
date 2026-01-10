// app/api/community/discussions/[id]/replies/[replyId]/route.ts - TYPESCRIPT FIXED
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import mongoose from 'mongoose';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    await connectDb();

    // Verify token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const params = await context.params;
    const discussionId = params.id;
    const replyId = params.replyId;

    console.log('🗑️ Delete reply:', replyId, 'by user:', userId);

    // Check database connection
    if (!mongoose.connection.db) {
      throw new Error('Database not connected');
    }

    const Discussion = mongoose.connection.db.collection('discussions');

    // Find discussion
    const discussion = await Discussion.findOne({
      _id: new mongoose.Types.ObjectId(discussionId)
    });

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // Find reply
    const replies = discussion.replies || [];
    const reply = replies.find((r: any) => r._id.toString() === replyId);

    if (!reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Check if user is reply author or admin
    const isAuthor = reply.authorId === userId;
    
    // Check admin status
    const roleResponse = await fetch(`${request.nextUrl.origin}/api/user/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let isAdmin = false;
    if (roleResponse.ok) {
      const roleData = await roleResponse.json();
      const userRole = roleData.success ? roleData.role : roleData.role;
      isAdmin = ['admin', 'super_admin'].includes(userRole);
    }

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this reply' },
        { status: 403 }
      );
    }

    // Delete reply
    await Discussion.updateOne(
      { _id: new mongoose.Types.ObjectId(discussionId) },
      { $pull: { replies: { _id: new mongoose.Types.ObjectId(replyId) } } as any }
    );

    console.log('✅ Reply deleted');

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Error deleting reply:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete reply' },
      { status: 500 }
    );
  }
}