// middleware.ts - EMERGENCY FIX - REMOVES ALL BLOCKING
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // TEMPORARILY: Allow ALL requests through
  // This will help us debug the actual issue
  return NextResponse.next();
}

// Only run on non-static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)"],
};
