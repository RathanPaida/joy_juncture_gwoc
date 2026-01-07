import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

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
    console.log('=== Fetching Admin Rewards ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      console.log('Unauthorized:', error);
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const rewards = await Reward.find().sort({ createdAt: -1 }).lean();
    
    console.log('Rewards found:', rewards.length);
    
    return NextResponse.json({ rewards });
  } catch (error: any) {
    console.error('Error fetching admin rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== Creating Admin Reward ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const body = await req.json();
    
    console.log('Creating reward:', body.name);
    
    const reward = new Reward(body);
    await reward.save();
    
    console.log('Reward created:', reward._id);
    
    return NextResponse.json({ success: true, reward }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: 'Failed to create reward', details: error.message },
      { status: 500 }
    );
  }
}