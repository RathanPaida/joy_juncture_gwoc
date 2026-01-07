import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';
import mongoose from 'mongoose';

const Reward = mongoose.models.Reward;

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Points issued (positive amounts)
    const pointsIssuedResult = await Transaction.aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Points redeemed (negative amounts)
    const pointsRedeemedResult = await Transaction.aggregate([
      { $match: { amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Active rewards
    const activeRewards = Reward ? await Reward.countDocuments({ isActive: true }) : 0;
    
    return NextResponse.json({
      totalUsers,
      totalPointsIssued: pointsIssuedResult[0]?.total || 0,
      totalPointsRedeemed: Math.abs(pointsRedeemedResult[0]?.total || 0),
      activeRewards
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}