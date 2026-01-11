import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import { GameSession } from '@/models/Game';

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }
    
    // Get game session
    const gameSession = await GameSession.findOne({ gameId });
    
    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Return game data
    return NextResponse.json({
      success: true,
      gameId: gameSession.gameId,
      gameType: gameSession.gameType,
      difficulty: gameSession.difficulty,
      puzzle: gameSession.gameState.puzzle,
      solution: gameSession.gameState.solution,
      hints: gameSession.gameState.hints || [],
      initial: gameSession.gameState.initial,
      maxCoins: getMaxCoins(gameSession.gameType, gameSession.difficulty),
      hasTimeBonus: gameSession.difficulty !== 'easy'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error continuing game:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

function getMaxCoins(gameType: string, difficulty: string) {
  const rewards = {
    sudoku: { easy: 10, medium: 25, hard: 50 },
    'word-guesser': { easy: 5, medium: 15, hard: 30 },
    crossword: { easy: 15, medium: 35, hard: 70 }
  };
  
  const gameRewards = rewards[gameType as keyof typeof rewards];
  return gameRewards?.[difficulty as keyof typeof gameRewards] || 10;
}