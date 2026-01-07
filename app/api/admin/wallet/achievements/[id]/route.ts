import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  points: Number,
  requirement: Number,
  category: String,
  isActive: Boolean
});

const Achievement = mongoose.models.Achievement || 
  mongoose.model('Achievement', achievementSchema);

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
    
    const achievement = await Achievement.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );
    
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, achievement });
  } catch (error: any) {
    console.error('Error updating achievement:', error);
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
    const achievement = await Achievement.findByIdAndDelete(params.id);
    
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}