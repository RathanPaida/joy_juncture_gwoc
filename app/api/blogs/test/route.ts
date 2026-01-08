// app/api/blog/test/route.ts
// Simple test route to verify API structure is working

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Blog API is working!',
    timestamp: new Date().toISOString()
  });
}

// Test this by visiting: http://localhost:3000/api/blog/test