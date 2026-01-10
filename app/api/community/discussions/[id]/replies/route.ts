// app/api/community/discussions/[id]/replies/route.ts - TYPESCRIPT FIXED
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reply content is required' },
        { status: 400 }
      );
    }

    console.log('💬 Adding reply to discussion:', discussionId);

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

    // Get user info
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create reply
    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      content: content.trim(),
      authorId: userId,
      authorName: user.name,
      likes: 0,
      likedBy: [],
      isAuthor: discussion.authorId === userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add reply to discussion
    await Discussion.updateOne(
      { _id: new mongoose.Types.ObjectId(discussionId) },
      { $push: { replies: newReply } as any }
    );

    // Award 10 points for replying
    await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $inc: { totalPoints: 10, walletBalance: 10 } }
    );

    console.log('✅ Reply added, +10 points');

    return NextResponse.json({
      success: true,
      message: 'Reply posted successfully! +10 JJ Points',
      reply: newReply
    });
  } catch (error: any) {
    console.error('❌ Error adding reply:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add reply' },
      { status: 500 }
    );
  }
}