// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDb from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Check for Firebase authentication token
    const authHeader = request.headers.get('authorization');
    
    // Method 1: If using Firebase auth with Bearer token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const body = await request.json();
        const { email, name, avatar } = body;

        await connectDb();

        // Check if user exists in MongoDB
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
            createdAt: new Date(),
            lastLogin: new Date()
          });

          console.log('✅ New user created in MongoDB:', userId);
        } else {
          // Update last login and user info
          user.lastLogin = new Date();
          if (name && name !== user.name) user.name = name;
          if (avatar && avatar !== user.avatar) user.avatar = avatar;
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
            totalPoints: user.totalPoints
          }
        });
      } catch (firebaseError) {
        console.error('❌ Firebase auth error:', firebaseError);
        // If Firebase auth fails, try the generic sync method below
      }
    }

    // Method 2: Generic sync (for other auth providers or direct calls)
    const body = await request.json();
    console.log('Auth sync request:', body);
    
    await connectDb();
    
    if (body.userId || body.firebaseUid) {
      const query = body.userId ? { userId: body.userId } : { firebaseUid: body.firebaseUid };
      
      const updateData = {
        ...body,
        lastSync: new Date(),
        updatedAt: new Date(),
        // Set lastLogin if not provided
        lastLogin: body.lastLogin || new Date()
      };
      
      // Remove userId/firebaseUid from updateData to avoid overwriting the query field
      if (body.userId) delete updateData.userId;
      if (body.firebaseUid) delete updateData.firebaseUid;
      
      const user = await User.findOneAndUpdate(
        query,
        { 
          $set: updateData,
          $setOnInsert: {
            createdAt: new Date(),
            role: body.role || 'user',
            totalPoints: body.totalPoints || 0
          }
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      );
      
      console.log('✅ User synced via generic method:', body.userId || body.firebaseUid);
      
      return NextResponse.json({ 
        success: true,
        message: 'Sync completed successfully',
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          userId: user.userId,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          totalPoints: user.totalPoints
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Missing userId or firebaseUid in request body' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('❌ Auth sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync user', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}