// app/api/admin/wallet/achievements/[id]/route.ts - FIXED FOR NEXT.JS 15
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
  isActive: Boolean,
  updatedAt: Date
});

const Achievement = mongoose.models.Achievement || 
  mongoose.model('Achievement', achievementSchema);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    console.log('=== PUT Achievement:', id);
    
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ error: 'Invalid achievement ID' }, { status: 400 });
    }
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    const body = await req.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const existingAchievement = await Achievement.findById(id);
    
    if (!existingAchievement) {
      return NextResponse.json({ 
        error: 'Achievement not found',
        message: 'The achievement you are trying to update does not exist'
      }, { status: 404 });
    }
    
    const achievement = await Achievement.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!achievement) {
      return NextResponse.json({ 
        error: 'Update failed',
        message: 'Failed to update achievement in database'
      }, { status: 500 });
    }
    
    console.log('✅ Achievement updated:', achievement._id);
    
    return NextResponse.json({ 
      success: true, 
      achievement,
      message: 'Achievement updated successfully'
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Error updating achievement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    console.log('=== DELETE Achievement:', id);
    
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ error: 'Invalid achievement ID' }, { status: 400 });
    }
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const achievement = await Achievement.findByIdAndDelete(id);
    
    if (!achievement) {
      return NextResponse.json({ 
        error: 'Achievement not found',
        message: 'The achievement you are trying to delete does not exist'
      }, { status: 404 });
    }
    
    console.log('✅ Achievement deleted:', id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Achievement deleted successfully'
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Error deleting achievement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}