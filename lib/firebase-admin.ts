// lib/firebase-admin.ts - FIXED VERSION
import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Method 1: Using Service Account JSON (Recommended for production)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      // Parse the service account JSON
      const serviceAccountObj = JSON.parse(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountObj),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('✅ Firebase Admin initialized with service account');
    } 
    // Method 2: Using individual credentials (Alternative)
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      
      console.log('✅ Firebase Admin initialized with individual credentials');
    } 
    // Method 3: Application Default Credentials (for Google Cloud environments)
    else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('✅ Firebase Admin initialized with application default credentials');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw new Error(`Firebase Admin initialization failed: ${error}`);
  }
} else {
  console.log('ℹ️ Firebase Admin already initialized');
}

// Export the admin instance
export const adminApp = admin;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Verify ID Token function
export async function verifyIdToken(token: string) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return decodedToken;
  } catch (error: any) {
    console.error('❌ Token verification error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Token expired. Please login again.');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid token format.');
    } else if (error.message?.includes('Firebase app does not exist')) {
      throw new Error('Firebase Admin not initialized. Check server configuration.');
    }
    
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// Optional: Create custom token
export async function createCustomToken(uid: string, claims?: object) {
  try {
    const token = await adminAuth.createCustomToken(uid, claims);
    return token;
  } catch (error: any) {
    console.error('❌ Error creating custom token:', error);
    throw error;
  }
}

// Optional: Get user by UID
export async function getUserByUid(uid: string) {
  try {
    const user = await adminAuth.getUser(uid);
    return user;
  } catch (error: any) {
    console.error('❌ Error getting user:', error);
    throw error;
  }
}

// Optional: Get user by email
export async function getUserByEmail(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    return user;
  } catch (error: any) {
    console.error('❌ Error getting user by email:', error);
    throw error;
  }
}

export default admin;