// app/api/admin/check-access/route.ts
// Make sure this file is at EXACTLY this path!

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Check Access Route Called ===');
    
    await connectDb();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No auth header found');
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, verifying...');
    
    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);
    console.log('Token verified for user:', decodedToken.email);
    
    // Find user in MongoDB
    const user = await User.findOne({ 
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email?.toLowerCase() }
      ]
    });
    
    if (!user) {
      console.log('User not found in MongoDB');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('User found:', user.email, 'Role:', user.role);
    
    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.log('User is not admin. Current role:', user.role);
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          currentRole: user.role,
          requiredRole: 'admin or super_admin'
        },
        { status: 403 }
      );
    }
    
    console.log('✅ Admin access granted!');
    
    return NextResponse.json({ 
      authorized: true, 
      role: user.role,
      email: user.email,
      message: 'Admin access granted'
    });
    
  } catch (error: any) {
    console.error('Check access error:', error);
    return NextResponse.json(
      { 
        error: 'Server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Same as GET
  return GET(req);
}