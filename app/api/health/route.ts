// app/api/health/route.ts
// This endpoint checks if all your services are working
import { NextResponse } from "next/server";
import { adminAuth, adminDb, checkFirebaseAdminHealth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  const checks: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // 1. Check Firebase Admin
  try {
    const firebaseHealth = await checkFirebaseAdminHealth();
    checks.checks.firebaseAdmin = {
      status: firebaseHealth.status,
      message: firebaseHealth.message,
    };
  } catch (error: any) {
    checks.checks.firebaseAdmin = {
      status: "error",
      message: error.message,
    };
  }

  // 2. Check MongoDB Connection
  try {
    await connectDb();
    const mongoStatus = mongoose.connection.readyState;
    const statusMap: any = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    
    checks.checks.mongodb = {
      status: mongoStatus === 1 ? "healthy" : "unhealthy",
      state: statusMap[mongoStatus] || "unknown",
      message: mongoStatus === 1 ? "MongoDB connected" : "MongoDB not connected",
    };
  } catch (error: any) {
    checks.checks.mongodb = {
      status: "error",
      message: error.message,
    };
  }

  // 3. Check Environment Variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "MONGODB_URI",
  ];

  const firebaseAdminVars = [
    "FIREBASE_SERVICE_ACCOUNT_KEY",
    "FIREBASE_PROJECT_ID", // Alternative
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  const hasFirebaseAdmin = firebaseAdminVars.some(
    (varName) => !!process.env[varName]
  );

  checks.checks.environment = {
    status: missingEnvVars.length === 0 && hasFirebaseAdmin ? "healthy" : "warning",
    missingVars: missingEnvVars,
    firebaseAdminConfigured: hasFirebaseAdmin,
    message:
      missingEnvVars.length === 0 && hasFirebaseAdmin
        ? "All required environment variables set"
        : "Some environment variables missing",
  };

  // 4. Check Firebase Auth Service
  try {
    await adminAuth.listUsers(1);
    checks.checks.firebaseAuth = {
      status: "healthy",
      message: "Firebase Auth service accessible",
    };
  } catch (error: any) {
    checks.checks.firebaseAuth = {
      status: "error",
      message: error.message,
    };
  }

  // 5. Check Firestore (optional, if you're using it)
  try {
    const testDoc = await adminDb.collection("_health_check").doc("test").get();
    checks.checks.firestore = {
      status: "healthy",
      message: "Firestore accessible",
    };
  } catch (error: any) {
    checks.checks.firestore = {
      status: "warning",
      message: "Firestore not accessible (may not be needed)",
    };
  }

  // Overall health status
  const allHealthy = Object.values(checks.checks).every(
    (check: any) => check.status === "healthy"
  );
  const hasErrors = Object.values(checks.checks).some(
    (check: any) => check.status === "error"
  );

  checks.overall = {
    status: hasErrors ? "unhealthy" : allHealthy ? "healthy" : "degraded",
    message: hasErrors
      ? "Some services are not working"
      : allHealthy
      ? "All services operational"
      : "Some services degraded",
  };

  // Return appropriate status code
  const statusCode = hasErrors ? 503 : 200;

  return NextResponse.json(checks, { status: statusCode });
}

// POST endpoint to test with authentication
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "No authorization token",
          hint: "Send: Authorization: Bearer <your-firebase-token>",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      success: true,
      message: "Authentication working correctly",
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error.message,
      },
      { status: 401 }
    );
  }
}