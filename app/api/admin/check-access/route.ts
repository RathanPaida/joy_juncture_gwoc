// app/api/admin/check-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Admin Access Check ===');
    
    const result = await checkAdminAccess(req);
    
    if (!result.authorized) {
      console.log('Access denied:', result.error);
      return NextResponse.json(
        { error: result.error || 'Access denied' },
        { status: 403 }
      );
    }

    console.log('Access granted for:', result.user?.email);
    
    return NextResponse.json({
      success: true,
      message: 'Admin access verified',
      user: {
        email: result.user?.email,
        role: result.user?.role,
        isAdmin: result.user?.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}