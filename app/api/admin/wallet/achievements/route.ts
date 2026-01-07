// app/api/admin/wallet/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'FaTrophy' },
  points: { type: Number, required: true },
  requirement: { type: Number, required: true },
  category: { type: String, default: 'general' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Achievement = mongoose.models.Achievement || 
  mongoose.model('Achievement', achievementSchema);

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const achievements = await Achievement.find().sort({ createdAt: -1 });
    
    return NextResponse.json({ achievements });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const body = await req.json();
    
    const achievement = new Achievement(body);
    await achievement.save();
    
    return NextResponse.json({ success: true, achievement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}