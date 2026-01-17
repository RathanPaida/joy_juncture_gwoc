// app/api/user/snake-high-score/route.ts - SIMPLIFIED (NO POINTS)
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { userId, difficulty, score } = await request.json();

    // Validate input
    if (!userId || !difficulty || typeof score !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    if (score < 0) {
      return NextResponse.json(
        { success: false, error: 'Score cannot be negative' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the user making the request owns this account
    if (user.firebaseUid !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Cannot update another user\'s score' },
        { status: 403 }
      );
    }

    // Initialize snakeHighScores if it doesn't exist
    const currentHighScores = user.snakeHighScores || {
      easy: 0,
      medium: 0,
      hard: 0
    };

    const previousScore = currentHighScores[difficulty] || 0;
    
    console.log(`📊 Score update request: ${difficulty} | Previous: ${previousScore} | New: ${score}`);

    // Only update if the new score is higher
    if (score > previousScore) {
      // ✅ SIMPLE: Just update the high score, NO POINTS
      const updatedHighScores = {
        ...currentHighScores,
        [difficulty]: score
      };

      user.snakeHighScores = updatedHighScores;
      await user.save();

      console.log(`✅ New high score saved for ${user.name}: ${difficulty} = ${score}`);
      console.log(`📈 Updated scores:`, updatedHighScores);

      return NextResponse.json({
        success: true,
        message: 'High score saved successfully',
        snakeHighScores: updatedHighScores,
        isNewRecord: true,
        previousScore,
        newScore: score,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`ℹ️ Score ${score} not higher than current high score ${previousScore} for ${difficulty}`);
      
      return NextResponse.json({
        success: true,
        message: 'Score not higher than current high score',
        snakeHighScores: currentHighScores,
        isNewRecord: false,
        previousScore,
        newScore: score,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('❌ Error saving snake high score:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await User.findOne({ firebaseUid: decodedToken.uid })
      .select('snakeHighScores name');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const snakeHighScores = user.snakeHighScores || {
      easy: 0,
      medium: 0,
      hard: 0
    };

    return NextResponse.json({
      success: true,
      snakeHighScores,
      userName: user.name,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error fetching snake high scores:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}