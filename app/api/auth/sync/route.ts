// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDb from '@/lib/mongodb';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    console.log('🔍 Auth sync request received');

    // Check if Firebase authentication is being used
    if (authHeader?.startsWith('Bearer ')) {
      return await handleFirebaseSync(authHeader, body);
    } else {
      // Fallback to generic sync for other auth systems
      return await handleGenericSync(body);
    }
  } catch (error: any) {
    console.error('❌ Auth sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync user',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle Firebase authentication sync
 */
async function handleFirebaseSync(authHeader: string, body: any) {
  try {
    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('✅ Firebase token verified:', userId);

    const { email, name, avatar } = body;

    // Check if user exists in MongoDB using Mongoose
    let user = await User.findOne({ firebaseUid: userId });

    if (!user) {
      // Create new user in MongoDB
      user = await User.create({
        firebaseUid: userId,
        email: email || decodedToken.email,
        name: name || decodedToken.name || email?.split('@')[0] || 'User',
        avatar: avatar || decodedToken.picture || null,
        role: 'user',
        totalPoints: 0,
        walletBalance: 0,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      console.log('✅ New user created in MongoDB:', userId);
    } else {
      // Update existing user
      user.lastLogin = new Date();
      
      if (name && name !== user.name) {
        user.name = name;
      }
      
      if (avatar && avatar !== user.avatar) {
        user.avatar = avatar;
      }
      
      if (email && email !== user.email) {
        user.email = email;
      }
      
      await user.save();

      console.log('✅ User synced in MongoDB:', userId);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        totalPoints: user.totalPoints,
        walletBalance: user.walletBalance || 0,
      },
    });
  } catch (error: any) {
    console.error('❌ Firebase sync error:', error);
    
    // If token is invalid or expired
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    throw error;
  }
}

/**
 * Handle generic authentication sync (for other auth systems like Clerk, NextAuth, etc.)
 */
async function handleGenericSync(body: any) {
  try {
    console.log('📝 Generic auth sync:', body);

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required for generic sync' },
        { status: 400 }
      );
    }

    // Update or create user using collection-based approach
    const updateData = {
      ...body,
      lastSync: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.updateOne(
      { userId: body.userId },
      {
        $set: updateData,
        $setOnInsert: {
          createdAt: new Date(),
          role: body.role || 'user',
          totalPoints: body.totalPoints || 0,
          walletBalance: body.walletBalance || 0,
        }
      },
      { upsert: true }
    );

    console.log('✅ Generic sync completed:', result.upsertedId ? 'created' : 'updated');

    // Fetch the updated user
    const user = await usersCollection.findOne({ userId: body.userId });

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      user: user,
      operation: result.upsertedId ? 'created' : 'updated'
    });
  } catch (error: any) {
    console.error('❌ Generic sync error:', error);
    throw error;
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Check if user exists
    const user = await User.findOne({ firebaseUid: userId });

    if (!user) {
      return NextResponse.json({
        synced: false,
        message: 'User not found in database'
      });
    }

    return NextResponse.json({
      synced: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        totalPoints: user.totalPoints,
        walletBalance: user.walletBalance || 0,
        lastLogin: user.lastLogin
      }
    });
  } catch (error: any) {
    console.error('❌ Sync status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status', details: error.message },
      { status: 500 }
    );
  }
}