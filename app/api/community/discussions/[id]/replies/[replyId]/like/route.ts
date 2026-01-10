// app/api/community/discussions/[id]/replies/[replyId]/like/route.ts - TYPESCRIPT FIXED
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(
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

    console.log('❤️ Like reply:', replyId, 'by user:', userId);

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
    const replyIndex = replies.findIndex((r: any) => r._id.toString() === replyId);

    if (replyIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      );
    }

    const reply = replies[replyIndex];
    const likedBy = reply.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    let action;
    if (hasLiked) {
      // Unlike
      await Discussion.updateOne(
        { 
          _id: new mongoose.Types.ObjectId(discussionId),
          'replies._id': new mongoose.Types.ObjectId(replyId)
        },
        {
          $pull: { 'replies.$.likedBy': userId } as any,
          $inc: { 'replies.$.likes': -1 }
        }
      );
      action = 'unlike';
    } else {
      // Like
      await Discussion.updateOne(
        { 
          _id: new mongoose.Types.ObjectId(discussionId),
          'replies._id': new mongoose.Types.ObjectId(replyId)
        },
        {
          $addToSet: { 'replies.$.likedBy': userId } as any,
          $inc: { 'replies.$.likes': 1 }
        }
      );
      action = 'like';
      
      // Award 2 points for liking a reply
      await User.findOneAndUpdate(
        { firebaseUid: userId },
        { $inc: { totalPoints: 2, walletBalance: 2 } }
      );
    }

    return NextResponse.json({
      success: true,
      action: action,
      message: action === 'like' ? '+2 points' : 'Unliked'
    });
  } catch (error: any) {
    console.error('❌ Error liking reply:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to like reply' },
      { status: 500 }
    );
  }
}