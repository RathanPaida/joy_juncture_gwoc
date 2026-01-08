// app/api/wallet/rewards/route.ts - PUBLIC ROUTE FOR USERS
import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    console.log('=== PUBLIC: Fetching Active Rewards ===');
    
    await connectDb();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ 
        success: false,
        error: 'Database not connected',
        rewards: []
      }, { status: 500 });
    }
    
    // Only fetch active rewards for public display
    const rewards = await db.collection('rewards')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`✅ Found ${rewards.length} active rewards`);
    
    // Convert to JSON-safe format
    const rewardsJSON = rewards.map(r => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
      points: r.points,
      category: r.category,
      icon: r.icon || 'FaGift',
      color: r.color || '#FF8C00',
      stock: r.stock || 0,
      isActive: true
    }));
    
    return NextResponse.json({ 
      success: true, 
      rewards: rewardsJSON
    });
  } catch (error: any) {
    console.error('❌ Error fetching rewards:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch rewards',
        rewards: []
      },
      { status: 500 }
    );
  }
}