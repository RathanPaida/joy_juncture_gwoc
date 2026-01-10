import { NextRequest } from 'next/server';
import { verifyIdToken } from './firebase-admin';

interface AdminCheckResult {
  authorized: boolean;
  error?: string;
  admin?: {  // Changed from 'user' to 'admin' to match your API route
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
  uid?: string;
}

export async function checkAdminAccess(req: NextRequest): Promise<AdminCheckResult> {
  try {
    console.log('🔐 Checking admin access...');
    
    // 1. Extract token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return { 
        authorized: false, 
        error: 'No authorization header' 
      };
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      console.log('❌ Empty token');
      return { 
        authorized: false, 
        error: 'Invalid token' 
      };
    }

    // 2. Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
      console.log('✅ Token verified for:', decodedToken.email);
    } catch (tokenError: any) {
      console.error('❌ Token verification failed:', tokenError.message);
      return { 
        authorized: false, 
        error: 'Invalid or expired token' 
      };
    }

    // 3. TEMPORARY: Allow any authenticated user
    // TODO: Add proper admin check after testing
    console.log('✅ BYPASS MODE: Granting admin access to:', decodedToken.email);
    console.log('⚠️ WARNING: This is temporary - add proper admin check later!');
    
    return { 
      authorized: true, 
      admin: {  // Changed from 'user' to 'admin'
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0],
        role: 'admin'  // Temporary - hardcoded as admin
      },
      uid: decodedToken.uid 
    };

  } catch (error: any) {
    console.error('❌ Admin check error:', error);
    return { 
      authorized: false, 
      error: `Authentication error: ${error.message}` 
    };
  }
}

// Helper to check if user is admin (for future use)
export async function isUserAdmin(email: string): Promise<boolean> {
  // TODO: Implement proper admin check
  return true; // Temporary bypass
}

// NEW: Add a bypass version for public pages like CardGames
export async function checkAdminAccessBypass(req: NextRequest): Promise<AdminCheckResult> {
  console.log('🔓 BYPASS MODE: Skipping authentication check');
  console.log('⚠️ WARNING: This should only be used for development!');
  
  return {
    authorized: true,
    admin: {
      id: 'dev-admin-id',
      email: 'admin@test.com',
      name: 'Development Admin',
      role: 'admin'
    }
  };
}