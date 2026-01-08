// app/api/admin/wallet/achievements/[id]/route.ts
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('========================================');
    console.log('PUT /api/admin/wallet/achievements/' + params.id);
    console.log('========================================');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ AUTHORIZATION FAILED:', error);
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Authorization passed');
    
    await connectDb();
    console.log('✅ Database connected');
    
    const body = await req.json();
    console.log('📦 Update data:', JSON.stringify(body, null, 2));
    
    const achievement = await Achievement.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!achievement) {
      console.log('❌ Achievement not found:', params.id);
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Achievement updated:', achievement._id);
    
    return NextResponse.json({ 
      success: true, 
      achievement,
      message: 'Achievement updated successfully'
    });
  } catch (error: any) {
    console.error('❌ ERROR in PUT achievement:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('========================================');
    console.log('DELETE /api/admin/wallet/achievements/' + params.id);
    console.log('========================================');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ AUTHORIZATION FAILED:', error);
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Authorization passed');
    
    await connectDb();
    console.log('✅ Database connected');
    
    const achievement = await Achievement.findByIdAndDelete(params.id);
    
    if (!achievement) {
      console.log('❌ Achievement not found:', params.id);
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Achievement deleted:', params.id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ ERROR in DELETE achievement:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}