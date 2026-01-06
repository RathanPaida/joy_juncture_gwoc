// app/api/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    
    let user = null;
    const authHeader = req.headers.get('authorization');
    
    // Check for Firebase token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await verifyIdToken(token);
        
        // Ensure we have required fields
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email || 'unknown@email.com'; // Provide default
        const name = decodedToken.name || email.split('@')[0]; // Use email prefix as default name
        const picture = decodedToken.picture || undefined;
        
        // Find or create user by Firebase UID
        user = await User.findOrCreateByFirebase(firebaseUid, email, name, picture);
      } catch (firebaseError) {
        console.log('Firebase auth failed:', firebaseError);
        // Continue to try other auth methods
      }
    }
    
    // If no Firebase user, check session/local auth
    if (!user) {
      const sessionToken = req.cookies.get('session')?.value;
      if (sessionToken) {
        // Verify your session token and get user
        // user = await getUserFromSession(sessionToken);
        // For now, we'll return an error since session auth is not implemented
        return NextResponse.json(
          { error: 'Session authentication not implemented' },
          { status: 401 }
        );
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get recent transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        totalPoints: user.totalPoints || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        walletBalance: user.walletBalance || 0,
        achievements: user.achievements || [],
        referralCode: user.referralCode,
        avatar: user.avatar,
        authProvider: user.authProvider,
        lastActivity: user.lastActivity
      },
      transactions
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}