// lib/auth.ts
import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return null;
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}