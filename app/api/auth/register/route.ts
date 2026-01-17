export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const uid = randomBytes(16).toString('hex');

    // Create user
    await usersCollection.insertOne({
      uid,
      email,
      name,
      passwordHash,
      totalPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create session
    const sessionToken = randomBytes(32).toString('hex');
    const sessionsCollection = db.collection('sessions');

    await sessionsCollection.insertOne({
      token: sessionToken,
      userId: uid,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const response = NextResponse.json({
      success: true,
      user: { uid, email, name, totalPoints: 0 }
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}