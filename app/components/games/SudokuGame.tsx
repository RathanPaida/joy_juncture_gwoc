'use client';

import { useState, useEffect } from 'react';
import type { SudokuGameData } from '@/types/games';
import { useAuth } from '@/app/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import SudokuGrid from '@/app/components/games/SudokuGrid';

interface SudokuGameProps {
  gameData: SudokuGameData;
  onComplete: (result: any) => void;
}

export default function SudokuGame({ gameData, onComplete }: SudokuGameProps) {
  const { user } = useAuth();
  const [grid, setGrid] = useState(gameData.puzzle);
  const [time, setTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCellChange = (row: number, col: number, value: number) => {
    const newGrid = grid.map(row => [...row]);
    newGrid[row][col] = value;
    setGrid(newGrid);
    
    // Check if puzzle is complete
    if (checkCompletion(newGrid, gameData.solution)) {
      handleComplete(newGrid);
    }
  };

  const checkCompletion = (currentGrid: number[][], solution: number[][]) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentGrid[i][j] !== solution[i][j]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleComplete = async (completedGrid: number[][]) => {
    setIsComplete(true);
    
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.error('User not authenticated');
        return;
      }
      
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/games/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId: gameData.gameId,
          solution: completedGrid,
          timeSpent: time
        })
      });
      
      const result = await response.json();
      onComplete(result);
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sudoku</h2>
          <div className="text-lg font-semibold">
            Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800">
            <strong>Reward:</strong> Up to {gameData.maxCoins} coins
            {gameData.hasTimeBonus && ' + time bonus'}
          </p>
        </div>
      </div>
      
      <SudokuGrid
        grid={grid}
        initial={gameData.initial}
        onCellChange={handleCellChange}
      />
      
      {isComplete && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800 font-semibold">
            🎉 Puzzle completed! Check your wallet for coins.
          </p>
        </div>
      )}
    </div>
  );
}