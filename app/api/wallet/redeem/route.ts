// app/api/wallet/redeem/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';
import mongoose from 'mongoose';

// Reward model (reuse from rewards route)
const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  points: { type: Number, required: true },
  category: { type: String, required: true },
  icon: { type: String, default: 'FaGift' },
  color: { type: String, default: '#FF8C00' },
  stock: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Reward = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);

export async function POST(req: NextRequest) {
  try {
    console.log('=== Redeem Request Started ===');
    await connectDb();
    
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split('Bearer ')[1];
    let user;
    
    try {
      const decodedToken = await verifyIdToken(token);
      console.log('Token verified for:', decodedToken.email);
      
      user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (!user) {
        user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    } catch (authError: any) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token', details: authError.message },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await req.json();
    const { rewardId } = body;
    
    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Redeeming reward:', rewardId, 'for user:', user.email);
    
    // Find the reward
    const reward = await Reward.findById(rewardId);
    
    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }
    
    if (!reward.isActive) {
      return NextResponse.json(
        { error: 'This reward is no longer available' },
        { status: 400 }
      );
    }
    
    if (reward.stock <= 0) {
      return NextResponse.json(
        { error: 'This reward is out of stock' },
        { status: 400 }
      );
    }
    
    // Check if user has enough points
    const userPoints = user.totalPoints || 0;
    if (userPoints < reward.points) {
      return NextResponse.json(
        { 
          error: 'Insufficient points',
          required: reward.points,
          current: userPoints,
          needed: reward.points - userPoints
        },
        { status: 400 }
      );
    }
    
    // Perform the redemption in a transaction-like manner
    try {
      // Deduct points from user
      user.totalPoints = userPoints - reward.points;
      
      // Update last activity
      user.lastActivity = new Date();
      
      // Decrease reward stock
      reward.stock -= 1;
      
      // Save both
      await user.save();
      await reward.save();
      
      // Validate user ID
      const userId = user._id?.toString();
      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }
      
      // Create transaction record
      const transaction = new Transaction({
        userId: userId,
        type: 'redeem',
        amount: -reward.points,
        description: `Redeemed: ${reward.name}`,
        referenceId: rewardId,
        metadata: {
          rewardName: reward.name,
          rewardCategory: reward.category,
          rewardDescription: reward.description
        },
        balanceAfter: user.totalPoints,
        status: 'completed'
      });
      
      await transaction.save();
      
      console.log('Redemption successful');
      
      // Check if this is first redemption achievement
      const hasRedeemedBefore = await Transaction.countDocuments({
        userId: userId,
        type: 'redeem'
      });
      
      if (hasRedeemedBefore === 1) {
        // First redemption! Unlock achievement
        const existingAch = user.achievements.find(
          (a: any) => a.achievementId === 'reward_redeemer'
        );
        
        if (!existingAch) {
          user.achievements.push({
            achievementId: 'reward_redeemer',
            unlocked: true,
            progress: 1,
            unlockedAt: new Date()
          });
          
          // Award achievement points
          user.totalPoints += 100;
          await user.save();
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully redeemed ${reward.name}`,
        newBalance: user.totalPoints,
        reward: {
          name: reward.name,
          description: reward.description,
          points: reward.points
        },
        transaction: {
          _id: transaction._id,
          createdAt: transaction.createdAt
        }
      }, { status: 200 });
      
    } catch (saveError: any) {
      console.error('Error during redemption:', saveError);
      
      // Rollback might be needed here in production
      // For now, just return error
      return NextResponse.json(
        { 
          error: 'Failed to complete redemption',
          details: saveError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('=== Redeem Request Error ===');
    console.error(error);
    
    return NextResponse.json(
      { 
        error: 'Server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}