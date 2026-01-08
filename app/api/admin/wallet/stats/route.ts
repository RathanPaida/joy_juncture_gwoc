// app/api/admin/wallet/stats/route.ts - FIXED WITH CORRECT CALCULATIONS
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    console.log('=== GET Wallet Stats ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ Unauthorized:', error);
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified, fetching stats...');
    
    await connectDb();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    // Count total users
    const totalUsers = await db.collection('users').countDocuments();
    console.log('📊 Total users:', totalUsers);
    
    // Calculate total points issued (sum of all positive transactions)
    const pointsIssuedResult = await db.collection('transactions').aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const totalPointsIssued = pointsIssuedResult.length > 0 ? pointsIssuedResult[0].total : 0;
    console.log('💰 Total points issued:', totalPointsIssued);
    
    // Calculate total points redeemed (sum of all negative transactions)
    const pointsRedeemedResult = await db.collection('transactions').aggregate([
      { $match: { amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const totalPointsRedeemed = pointsRedeemedResult.length > 0 ? Math.abs(pointsRedeemedResult[0].total) : 0;
    console.log('🎁 Total points redeemed:', totalPointsRedeemed);
    
    // Count active rewards
    const activeRewards = await db.collection('rewards').countDocuments({ isActive: true });
    console.log('🎯 Active rewards:', activeRewards);
    
    // Additional stats
    const activeAchievements = await db.collection('achievements').countDocuments({ isActive: true });
    const activeCriteria = await db.collection('pointscriterias').countDocuments({ isActive: true });
    
    // Total points in circulation (sum of all user points)
    const pointsInCirculation = await db.collection('users').aggregate([
      { $group: { _id: null, total: { $sum: '$totalPoints' } } }
    ]).toArray();
    const totalPointsInCirculation = pointsInCirculation.length > 0 ? pointsInCirculation[0].total : 0;
    
    // Recent transactions count
    const recentTransactionsCount = await db.collection('transactions')
      .countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });
    
    const stats = {
      totalUsers,
      totalPointsIssued,
      totalPointsRedeemed,
      totalPointsInCirculation,
      activeRewards,
      activeAchievements,
      activeCriteria,
      recentTransactionsCount,
      timestamp: new Date()
    };
    
    console.log('✅ Stats calculated:', stats);
    
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}