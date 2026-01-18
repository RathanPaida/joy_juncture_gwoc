// lib/firebase-admin.ts
import * as admin from "firebase-admin";

// Initialize Firebase Admin
function initializeFirebaseAdmin(): admin.app.App {
  // If already initialized, return existing instance
  if (admin.apps.length > 0) {
    console.log("ℹ️ Firebase Admin already initialized");
    const existingApp = admin.apps[0];
    if (!existingApp) {
      throw new Error("Firebase Admin app exists but is null");
    }
    return existingApp;
  }

  try {
    console.log("🔄 Initializing Firebase Admin...");

    // Method 1: Using Service Account JSON (Recommended for production)
    // TEMPORARILY DISABLED to debug build error

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      try {
        const serviceAccountObj = JSON.parse(serviceAccount);

        // Validate that required fields exist AND are non-empty strings BEFORE passing to Firebase
        const hasValidProjectId = typeof serviceAccountObj.project_id === 'string' && serviceAccountObj.project_id.trim().length > 0;
        const hasValidPrivateKey = typeof serviceAccountObj.private_key === 'string' && serviceAccountObj.private_key.trim().length > 0;
        const hasValidClientEmail = typeof serviceAccountObj.client_email === 'string' && serviceAccountObj.client_email.trim().length > 0;

        if (!hasValidProjectId || !hasValidPrivateKey || !hasValidClientEmail) {
          console.warn("⚠️ Service account JSON has invalid or empty required fields");
          console.warn(`   Valid project_id: ${hasValidProjectId} (value: ${JSON.stringify(serviceAccountObj.project_id)})`);
          console.warn(`   Valid private_key: ${hasValidPrivateKey}`);
          console.warn(`   Valid client_email: ${hasValidClientEmail}`);
          console.warn("   Skipping service account JSON method, trying other credential methods...");
          // Don't throw, just skip to next method
        } else {
          try {
            const app = admin.initializeApp({
              credential: admin.credential.cert(serviceAccountObj),
            });

            console.log("✅ Firebase Admin initialized with service account JSON");
            return app;
          } catch (certError: any) {
            console.error("❌ Failed to create Firebase credential:", certError.message);
            // Don't throw, try other methods
          }
        }
      } catch (parseError: any) {
        console.error("❌ Failed to parse service account JSON:", parseError.message);
        // Don't throw here, try other methods
      }
    }


    // Method 2: Using individual credentials
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });

      console.log("✅ Firebase Admin initialized with individual credentials");
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Client Email: ${clientEmail}`);
      return app;
    }

    // Method 3: Application Default Credentials (Google Cloud)
    const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (publicProjectId || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: publicProjectId,
        });

        console.log("✅ Firebase Admin initialized with application default credentials");
        return app;
      } catch (adcError) {
        console.warn("⚠️ Application default credentials not available");
        // Don't return here, fall through to error
      }
    }

    // If we get here, no credentials were found
    console.warn(
      "⚠️ Firebase Admin initialization skipped: No valid credentials found. " +
      "This is normal during build time."
    );

    // Return a placeholder that will throw errors if actually used
    throw new Error(
      "Firebase Admin not configured - credentials missing"
    );

  } catch (error: any) {
    console.error("❌ Error initializing Firebase Admin:", error.message);

    // Re-throw the error so lazy initialization will fail properly
    throw error;
  }
}

// Lazy initialization - only initialize when needed
let appInstance: admin.app.App | null = null;
let initializationError: Error | null = null;

function getFirebaseAdminApp(): admin.app.App {
  // If we previously failed to initialize, throw the cached error
  if (initializationError) {
    throw initializationError;
  }

  if (!appInstance) {
    try {
      appInstance = initializeFirebaseAdmin();
    } catch (error) {
      // Cache the error so we don't keep trying to initialize
      initializationError = error as Error;
      throw error;
    }
  }
  return appInstance;
}

// Export Firebase Admin services with lazy initialization and error handling
export const adminAuth = {
  verifyIdToken: async (token: string) => {
    try {
      const app = getFirebaseAdminApp();
      return admin.auth(app).verifyIdToken(token);
    } catch (error: any) {
      // If Firebase Admin isn't initialized, throw a clear error
      if (error.message?.includes('credentials missing')) {
        throw new Error('Firebase Admin not configured - authentication unavailable');
      }
      throw error;
    }
  },
  createCustomToken: async (uid: string, claims?: object) => {
    const app = getFirebaseAdminApp();
    return admin.auth(app).createCustomToken(uid, claims);
  },
  getUser: async (uid: string) => {
    const app = getFirebaseAdminApp();
    return admin.auth(app).getUser(uid);
  },
  getUserByEmail: async (email: string) => {
    const app = getFirebaseAdminApp();
    return admin.auth(app).getUserByEmail(email);
  },
  listUsers: async (maxResults?: number) => {
    const app = getFirebaseAdminApp();
    return admin.auth(app).listUsers(maxResults);
  },
  updateUser: async (uid: string, properties: admin.auth.UpdateRequest) => {
    const app = getFirebaseAdminApp();
    return admin.auth(app).updateUser(uid, properties);
  },
};

export const adminDb = {
  collection: (collectionPath: string) => {
    const app = getFirebaseAdminApp();
    return admin.firestore(app).collection(collectionPath);
  },
  doc: (documentPath: string) => {
    const app = getFirebaseAdminApp();
    return admin.firestore(app).doc(documentPath);
  },
};

// Verify ID Token function with better error handling
export async function verifyIdToken(token: string) {
  try {
    if (!token || token.trim() === "") {
      throw new Error("No token provided");
    }

    // Remove "Bearer " prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, "");

    // Verify the token using lazy-initialized adminAuth
    const decodedToken = await adminAuth.verifyIdToken(cleanToken);

    return decodedToken;
  } catch (error: any) {
    console.error("❌ Token verification error:", error.message);

    // Provide specific error messages
    if (error.code === "auth/id-token-expired") {
      throw new Error("Token expired. Please log in again.");
    } else if (error.code === "auth/argument-error") {
      throw new Error("Invalid token format. Please log in again.");
    } else if (error.code === "auth/id-token-revoked") {
      throw new Error("Token has been revoked. Please log in again.");
    } else if (error.code === "auth/user-disabled") {
      throw new Error("User account has been disabled.");
    } else if (error.message?.includes("Firebase app does not exist")) {
      throw new Error("Firebase Admin not initialized. Check server configuration.");
    }

    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// Create custom token
export async function createCustomToken(uid: string, claims?: object) {
  try {
    const token = await adminAuth.createCustomToken(uid, claims);
    return token;
  } catch (error: any) {
    console.error("❌ Error creating custom token:", error);
    throw new Error(`Failed to create custom token: ${error.message}`);
  }
}

// Get user by UID
export async function getUserByUid(uid: string) {
  try {
    const user = await adminAuth.getUser(uid);
    return user;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error(`User not found: ${uid}`);
    }
    console.error("❌ Error getting user:", error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    return user;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error(`User not found: ${email}`);
    }
    console.error("❌ Error getting user by email:", error);
    throw new Error(`Failed to get user by email: ${error.message}`);
  }
}

// Health check function
export async function checkFirebaseAdminHealth() {
  try {
    // Try to list users (limited to 1) as a health check
    await adminAuth.listUsers(1);
    return { status: "healthy", message: "Firebase Admin is working" };
  } catch (error: any) {
    return {
      status: "unhealthy",
      message: `Firebase Admin error: ${error.message}`
    };
  }
}

// Export the admin instance
export default admin;