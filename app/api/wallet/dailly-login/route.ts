// app/api/wallet/daily-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDb from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';

const DAILY_LOGIN_POINTS = 10; // Points for daily login

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Get user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
    const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
    if (lastActivityDate) {
      lastActivityDate.setHours(0, 0, 0, 0);
    }

    // If already logged in today, don't give points
    if (lastActivityDate && lastActivityDate.getTime() === today.getTime()) {
      return NextResponse.json({
        success: true,
        message: 'Already logged in today',
        alreadyClaimed: true,
        currentPoints: user.totalPoints,
        currentStreak: user.streak
      });
    }

    // Calculate streak
    let newStreak = 1;
    if (lastActivityDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If last login was yesterday, increment streak
      if (lastActivityDate.getTime() === yesterday.getTime()) {
        newStreak = (user.streak || 0) + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    }

    // Calculate bonus points based on streak
    let bonusPoints = DAILY_LOGIN_POINTS;
    if (newStreak >= 7) {
      bonusPoints += 20; // Extra 20 points for 7+ day streak
    } else if (newStreak >= 3) {
      bonusPoints += 5; // Extra 5 points for 3+ day streak
    }

    // Update user points and streak
    const newTotalPoints = (user.totalPoints || 0) + bonusPoints;
    const newWalletBalance = (user.walletBalance || 0) + bonusPoints;
    
    user.totalPoints = newTotalPoints;
    user.walletBalance = newWalletBalance;
    user.streak = newStreak;
    user.lastActivity = new Date();
    await user.save();

    // Create transaction record
    await Transaction.create({
      userId: user._id.toString(),
      type: 'daily',
      amount: bonusPoints,
      description: `Daily login bonus (${newStreak} day streak)`,
      balanceAfter: newWalletBalance,
      status: 'completed',
      metadata: {
        streak: newStreak,
        basePoints: DAILY_LOGIN_POINTS,
        bonusPoints: bonusPoints - DAILY_LOGIN_POINTS
      }
    });

    return NextResponse.json({
      success: true,
      message: `You earned ${bonusPoints} points!`,
      pointsEarned: bonusPoints,
      currentPoints: newTotalPoints,
      currentStreak: newStreak,
      newLogin: true
    });

  } catch (error: any) {
    console.error('❌ Error processing daily login:', error);
    return NextResponse.json(
      { error: 'Failed to process daily login', details: error.message },
      { status: 500 }
    );
  }
}