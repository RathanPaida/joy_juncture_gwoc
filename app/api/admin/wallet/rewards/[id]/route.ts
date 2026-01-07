// app/api/admin/wallet/rewards/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  name: String,
  description: String,
  points: Number,
  category: String,
  icon: String,
  color: String,
  stock: Number,
  isActive: Boolean
});

const Reward = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const body = await req.json();
    
    const reward = await Reward.findByIdAndUpdate(params.id, body, { new: true });
    
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, reward });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const reward = await Reward.findByIdAndDelete(params.id);
    
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}