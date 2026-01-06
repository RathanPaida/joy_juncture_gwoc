// app/api/wallet/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    
    const body = await req.json();
    const { email, name } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          _id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          totalPoints: existingUser.totalPoints || 100,
          level: existingUser.level || 1,
          streak: existingUser.streak || 0,
          referralCode: existingUser.referralCode,
          avatar: existingUser.avatar
        }
      }, { status: 200 });
    }
    
    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      authProvider: 'local',
      role: 'viewer',
      totalPoints: 100,
      level: 1,
      streak: 0,
      lastActivity: new Date(),
      achievements: [],
      walletBalance: 0,
      isActive: true,
      emailVerified: false
    });
    
    await newUser.save();
    
    return NextResponse.json({
      success: true,
      message: 'Wallet created successfully',
      user: {
        _id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        totalPoints: newUser.totalPoints,
        level: newUser.level,
        streak: newUser.streak,
        referralCode: newUser.referralCode,
        avatar: newUser.avatar
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet', details: error.message },
      { status: 500 }
    );
  }
}