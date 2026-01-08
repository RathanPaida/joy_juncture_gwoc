// app/api/admin/wallet/rewards/[id]/route.ts - COMPLETE FIX
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    console.log('=== UPDATE REWARD ===');
    console.log('Received ID:', id);
    console.log('ID type:', typeof id);
    console.log('ID length:', id?.length);
    
    if (!id || id === 'undefined' || id === 'null') {
      console.log('❌ Invalid ID detected');
      return NextResponse.json({ error: 'Invalid reward ID' }, { status: 400 });
    }
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ Unauthorized:', error);
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    const db = mongoose.connection.db;
    
    if (!db) {
      console.log('❌ Database not connected');
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    const body = await req.json();
    console.log('Update data:', JSON.stringify(body, null, 2));
    
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
      console.log('✅ ObjectId created:', objectId);
    } catch (err) {
      console.log('❌ Invalid ObjectId format:', err);
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    // First check if reward exists
    const existingReward = await db.collection('rewards').findOne({ _id: objectId });
    console.log('📋 Existing reward:', existingReward ? 'Found' : 'Not found');
    
    if (!existingReward) {
      console.log('❌ Reward not found in database');
      return NextResponse.json({ 
        error: 'Reward not found',
        id: id,
        message: 'The reward you are trying to update does not exist'
      }, { status: 404 });
    }
    
    const updateData = {
      name: body.name,
      description: body.description,
      points: Number(body.points),
      category: body.category,
      icon: body.icon || 'FaGift',
      color: body.color || '#FF8C00',
      stock: Number(body.stock),
      isActive: body.isActive !== false,
      updatedAt: new Date()
    };
    
    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
    
    const result = await db.collection('rewards').findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    console.log('📊 Update result:', result ? 'Success' : 'Failed');
    
    if (!result) {
      console.log('❌ Update operation failed');
      return NextResponse.json({ 
        error: 'Update failed',
        message: 'Failed to update reward in database'
      }, { status: 500 });
    }
    
    console.log('✅ Reward updated successfully');
    
    // Return the updated reward
    const updatedReward = {
      ...updateData,
      _id: objectId.toString(),
      createdAt: existingReward.createdAt
    };
    
    return NextResponse.json({ 
      success: true, 
      reward: updatedReward,
      message: 'Reward updated successfully'
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ UPDATE Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    console.log('=== DELETE REWARD ===');
    console.log('Received ID:', id);
    console.log('ID type:', typeof id);
    console.log('ID length:', id?.length);
    
    if (!id || id === 'undefined' || id === 'null') {
      console.log('❌ Invalid ID detected');
      return NextResponse.json({ error: 'Invalid reward ID' }, { status: 400 });
    }
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
      console.log('✅ ObjectId created:', objectId);
    } catch (err) {
      console.log('❌ Invalid ObjectId format:', err);
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const result = await db.collection('rewards').deleteOne({ _id: objectId });
    
    console.log('📊 Delete result - deletedCount:', result.deletedCount);
    
    if (result.deletedCount === 0) {
      console.log('❌ Reward not found in database');
      return NextResponse.json({ 
        success: false,
        message: 'Reward not found',
        deletedCount: 0
      }, { status: 404 });
    }
    
    console.log('✅ Reward deleted successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Reward deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('❌ DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}