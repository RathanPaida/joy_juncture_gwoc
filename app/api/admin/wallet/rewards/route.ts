// app/api/admin/wallet/rewards/route.ts - COMPLETE WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    console.log('=== GET REWARDS ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ Unauthorized:', error);
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    const rewards = await db.collection('rewards').find({}).toArray();
    
    console.log(`✅ Found ${rewards.length} rewards`);
    
    // Convert ObjectId to string for JSON serialization
    const rewardsJSON = rewards.map(r => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
      points: r.points,
      category: r.category,
      icon: r.icon || 'FaGift',
      color: r.color || '#FF8C00',
      stock: r.stock || 0,
      isActive: r.isActive !== false
    }));
    
    return NextResponse.json({ 
      success: true,
      rewards: rewardsJSON,
      count: rewardsJSON.length
    });
  } catch (error: any) {
    console.error('❌ GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== CREATE REWARD ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ Unauthorized:', error);
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }

    await connectDb();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    const body = await req.json();
    
    console.log('Creating reward:', body.name);
    
    // Validate required fields
    if (!body.name || !body.description || !body.points || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const newReward = {
      name: body.name,
      description: body.description,
      points: Number(body.points),
      category: body.category,
      icon: body.icon || 'FaGift',
      color: body.color || '#FF8C00',
      stock: Number(body.stock) || 100,
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('rewards').insertOne(newReward);
    
    console.log('✅ Reward created:', result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      reward: {
        ...newReward,
        _id: result.insertedId.toString()
      },
      message: 'Reward created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ CREATE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}