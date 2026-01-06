// lib/auth-utils.js
import { verifyIdToken } from '@/lib/firebase-admin';
import { User } from '@/models/User';

export async function authenticateRequest(req: { headers: { authorization: any; }; cookies: { session: any; }; }) {
  let user = null;
  
  // Try Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await verifyIdToken(token);
      user = await User.findOne({ firebaseUid: decodedToken.uid });
    } catch (error) {
      console.log('Firebase token invalid');
    }
  }
  
  // Try local session token
  if (!user && req.cookies?.session) {
    // Verify your local JWT or session token
    // user = await verifyLocalToken(req.cookies.session);
  }
  
  return user;
}

export function getUserId(user: { firebaseUid: any; _id: any; }) {
  if (user.firebaseUid) {
    return { firebaseUid: user.firebaseUid };
  }
  return { _id: user._id };
}