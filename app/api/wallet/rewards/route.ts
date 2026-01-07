// app/api/wallet/rewards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Reward Schema inline (or import if you have a separate model)
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

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching rewards...');
    await connectDb();
    
    // Fetch all active rewards
    const rewards = await Reward.find({ isActive: true })
      .sort({ points: 1 })
      .lean();
    
    console.log('Rewards found:', rewards.length);
    
    // If no rewards exist, create some default ones
    if (rewards.length === 0) {
      console.log('No rewards found, creating defaults...');
      
      const defaultRewards = [
        {
          name: '10% Discount Coupon',
          description: 'Get 10% off on your next purchase',
          points: 500,
          category: 'discount',
          icon: 'FaShoppingCart',
          color: '#4ECDC4',
          stock: 50,
          isActive: true
        },
        {
          name: 'Event Ticket',
          description: 'Free entry to any Joy Juncture event',
          points: 1000,
          category: 'ticket',
          icon: 'FaCalendarAlt',
          color: '#9B59B6',
          stock: 20,
          isActive: true
        },
        {
          name: 'Game Bundle',
          description: 'Exclusive bundle of 3 popular board games',
          points: 2000,
          category: 'bundle',
          icon: 'FaGamepad',
          color: '#FFCC00',
          stock: 10,
          isActive: true
        },
        {
          name: 'Premium Membership',
          description: '1 month of premium access',
          points: 3000,
          category: 'premium',
          icon: 'FaCrown',
          color: '#3498DB',
          stock: 15,
          isActive: true
        },
        {
          name: '25% Mega Discount',
          description: 'Get 25% off on your entire cart',
          points: 1500,
          category: 'discount',
          icon: 'FaStar',
          color: '#E74C3C',
          stock: 30,
          isActive: true
        }
      ];
      
      await Reward.insertMany(defaultRewards);
      
      const newRewards = await Reward.find({ isActive: true })
        .sort({ points: 1 })
        .lean();
      
      return NextResponse.json({ rewards: newRewards }, { status: 200 });
    }
    
    return NextResponse.json({ rewards }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    
    const body = await req.json();
    const { name, description, points, category, icon, color, stock } = body;
    
    // Validate required fields
    if (!name || !description || !points || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const newReward = new Reward({
      name,
      description,
      points,
      category,
      icon: icon || 'FaGift',
      color: color || '#FF8C00',
      stock: stock || 100,
      isActive: true
    });
    
    await newReward.save();
    
    return NextResponse.json({
      success: true,
      reward: newReward
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: 'Failed to create reward', details: error.message },
      { status: 500 }
    );
  }
}