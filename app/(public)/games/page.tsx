'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameCard from '@/app/components/games/GameCard';
import GameStats from '@/app/components/games/GameStats';

export default function GamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);

  const gameList = [
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Fill the grid with numbers 1-9',
      icon: '🧩',
      difficulties: ['easy', 'medium', 'hard'],
      color: 'bg-blue-100'
    },
    {
      id: 'word-guesser',
      title: 'Word Guesser',
      description: 'Unscramble the hidden word',
      icon: '🔤',
      difficulties: ['easy', 'medium', 'hard'],
      color: 'bg-green-100'
    },
    {
      id: 'crossword',
      title: 'Crossword',
      description: 'Solve the crossword puzzle',
      icon: '✏️',
      difficulties: ['easy', 'medium', 'hard'],
      color: 'bg-purple-100'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchGameStats();
    }
  }, [user]);

  const fetchGameStats = async () => {
    try {
      const response = await fetch('/api/games/stats', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Games Arena</h1>
        <p className="text-gray-600 mt-2">
          Play games and earn coins! Complete puzzles to add coins to your wallet.
        </p>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-800 font-semibold mr-2">🎮 Current Balance:</span>
            <span className="text-2xl font-bold text-yellow-600">
              {user?.totalPoints || 0} coins
            </span>
          </div>
        </div>
      </div>

      {stats && <GameStats stats={stats} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {gameList.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            user={user}
            onGameStart={fetchGameStats}
          />
        ))}
      </div>

      <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How it works</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">1</div>
            <p className="text-gray-700">Choose a game and difficulty level</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">2</div>
            <p className="text-gray-700">Complete the puzzle within the time limit</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">3</div>
            <p className="text-gray-700">Earn coins based on difficulty and completion time</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">4</div>
            <p className="text-gray-700">Coins are automatically added to your wallet</p>
          </div>
        </div>
      </div>
    </div>
  );
}