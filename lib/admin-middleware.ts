// lib/admin-middleware.ts - FIXED VERSION
import { NextRequest } from 'next/server';
import { verifyIdToken } from './firebase-admin';
import { connectDb } from './mongodb';
import { User, IUser } from '@/models/User';

interface AdminCheckResult {
  authorized: boolean;
  error?: string;
  user?: IUser;
}

export async function checkAdminAccess(req: NextRequest): Promise<AdminCheckResult> {
  try {
    await connectDb();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { authorized: false, error: 'No token provided' };
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);
    
    // Find user by Firebase UID or email
    const user = await User.findOne({ 
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email?.toLowerCase() }
      ]
    });
    
    if (!user) {
      return { authorized: false, error: 'User not found' };
    }
    
    // Check if user has admin privileges
    const allowedRoles: Array<'admin' | 'super_admin'> = ['admin', 'super_admin'];
    if (!allowedRoles.includes(user.role as any)) {
      return { 
        authorized: false, 
        error: `Insufficient permissions. Role: ${user.role}, Required: admin or super_admin` 
      };
    }
    
    return { authorized: true, user };
  } catch (error: any) {
    console.error('Admin access check error:', error);
    return { authorized: false, error: error.message };
  }
}

// Optional: Check for super admin only
export async function checkSuperAdminAccess(req: NextRequest): Promise<AdminCheckResult> {
  try {
    await connectDb();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { authorized: false, error: 'No token provided' };
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    const user = await User.findOne({ 
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email?.toLowerCase() }
      ]
    });
    
    if (!user) {
      return { authorized: false, error: 'User not found' };
    }
    
    if (user.role !== 'super_admin') {
      return { 
        authorized: false, 
        error: 'Super admin access required' 
      };
    }
    
    return { authorized: true, user };
  } catch (error: any) {
    return { authorized: false, error: error.message };
  }
}

// Helper to check if user has specific role
export async function checkUserRole(
  req: NextRequest, 
  requiredRoles: Array<'viewer' | 'editor' | 'admin' | 'super_admin'>
): Promise<AdminCheckResult> {
  try {
    await connectDb();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { authorized: false, error: 'No token provided' };
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    const user = await User.findOne({ 
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email?.toLowerCase() }
      ]
    });
    
    if (!user) {
      return { authorized: false, error: 'User not found' };
    }
    
    if (!requiredRoles.includes(user.role)) {
      return { 
        authorized: false, 
        error: `Insufficient permissions. Current role: ${user.role}, Required: ${requiredRoles.join(' or ')}` 
      };
    }
    
    return { authorized: true, user };
  } catch (error: any) {
    return { authorized: false, error: error.message };
  }
}