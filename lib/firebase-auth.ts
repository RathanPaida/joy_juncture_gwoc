// lib/firebase-auth.ts
import { getAuth } from "firebase/auth";

/**
 * Get Firebase authentication token for the current user
 */
export async function getFirebaseToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("No Firebase user logged in");
      return null;
    }

    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error("Error getting Firebase token:", error);
    return null;
  }
}

/**
 * Check if user is authenticated with Firebase
 */
export function isFirebaseAuthenticated(): boolean {
  try {
    const auth = getAuth();
    return !!auth.currentUser;
  } catch (error) {
    console.error("Error checking Firebase auth:", error);
    return false;
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser() {
  try {
    const auth = getAuth();
    return auth.currentUser;
  } catch (error) {
    console.error("Error getting Firebase user:", error);
    return null;
  }
}
