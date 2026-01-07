'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

interface GameCardProps {
  game: {
    id: string;
    title: string;
    description: string;
    icon: string;
    difficulties: string[];
    color: string;
  };
  user: any;
  onGameStart: () => void;
}

export default function GameCard({ game, user, onGameStart }: GameCardProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(game.difficulties[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = async () => {
    if (!user) {
      alert('Please login to play games');
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/games/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameType: game.id,
          difficulty: selectedDifficulty
        })
      });

      const gameData = await response.json();
      
      if (gameData.success) {
        // Store game data in session storage
        sessionStorage.setItem(`currentGame_${game.id}`, JSON.stringify(gameData));
        
        // Redirect to game page
        window.location.href = `/games/${game.id}?gameId=${gameData.gameId}`;
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRewardForDifficulty = (difficulty: string) => {
    const rewards = {
      sudoku: { easy: 10, medium: 25, hard: 50 },
      'word-guesser': { easy: 5, medium: 15, hard: 30 },
      crossword: { easy: 15, medium: 35, hard: 70 }
    };
    return rewards[game.id as keyof typeof rewards]?.[difficulty as keyof (typeof rewards)[keyof typeof rewards]] || 0;
  };

  return (
    <div className={`${game.color} rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl">{game.icon}</div>
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/50">
            {game.id.toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">{game.title}</h3>
        <p className="text-gray-600 mb-4">{game.description}</p>
        
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Select Difficulty:</p>
          <div className="flex gap-2">
            {game.difficulties.map((difficulty) => (
              <button
                key={difficulty}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDifficulty === difficulty
                    ? `${getDifficultyColor(difficulty)} ring-2 ring-offset-2 ring-current`
                    : 'bg-white/70 text-gray-600 hover:bg-white'
                }`}
                onClick={() => setSelectedDifficulty(difficulty)}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Reward:</span>
              <span className="ml-2 font-bold text-lg text-yellow-600">
                {getRewardForDifficulty(selectedDifficulty)} coins
              </span>
            </div>
            {selectedDifficulty !== 'easy' && (
              <span className="text-xs px-2 py-1 rounded bg-white/50">
                + time bonus
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={handleStartGame}
          disabled={isLoading || !user}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            user
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } ${isLoading ? 'opacity-75' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting Game...
            </span>
          ) : user ? (
            'Play Now'
          ) : (
            'Login to Play'
          )}
        </button>
        
        {!user && (
          <p className="text-sm text-center text-gray-500 mt-3">
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>{' '}
            to earn coins!
          </p>
        )}
      </div>
    </div>
  );
}