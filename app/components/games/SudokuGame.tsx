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
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (!isComplete) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isComplete]);

  const handleCellChange = (row: number, col: number, value: number) => {
    const newGrid = grid.map(row => [...row]);
    newGrid[row][col] = value;
    setGrid(newGrid);
    
    // Check if this cell is correct
    if (value !== 0 && value !== gameData.solution[row][col]) {
      setMistakes(prev => prev + 1);
    }
    
    // Check if puzzle is complete and correct
    if (checkCompletion(newGrid, gameData.solution)) {
      handleComplete(newGrid);
    }
  };

  const checkCompletion = (currentGrid: number[][], solution: number[][]) => {
    // Check if all cells are filled
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentGrid[i][j] === 0 || currentGrid[i][j] !== solution[i][j]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleComplete = async (completedGrid: number[][]) => {
    if (isComplete) return; // Prevent double submission
    
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
          gameType: 'sudoku',
          solution: completedGrid,
          timeSpent: time,
          metadata: {
            mistakes,
            difficulty: gameData.difficulty || 'medium'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete game');
      }
      
      const result = await response.json();
      onComplete(result);
    } catch (error) {
      console.error('Error completing game:', error);
      setIsComplete(false); // Allow retry
    }
  };

  const handleCheckSolution = () => {
    let errorCount = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] !== 0 && grid[i][j] !== gameData.solution[i][j]) {
          errorCount++;
        }
      }
    }
    
    if (errorCount === 0 && grid.flat().every(cell => cell !== 0)) {
      handleComplete(grid);
    } else {
      alert(`You have ${errorCount} incorrect cell(s). Keep trying!`);
    }
  };

  const handleReset = () => {
    setGrid(gameData.puzzle);
    setMistakes(0);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Sudoku Puzzle</h2>
          <div className="flex gap-4 items-center">
            <div className="text-lg font-semibold bg-blue-50 px-4 py-2 rounded-lg">
              ⏱️ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-lg font-semibold bg-red-50 px-4 py-2 rounded-lg">
              ❌ {mistakes} mistakes
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <p className="text-blue-800">
              <strong>Reward:</strong> Up to {gameData.maxCoins} coins
              {gameData.hasTimeBonus && ' + time bonus for fast completion'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCheckSolution}
                disabled={isComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                ✓ Check Solution
              </button>
              <button
                onClick={handleReset}
                disabled={isComplete}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4">
          <p className="text-amber-800 text-sm">
            <strong>How to play:</strong> Fill the 9×9 grid so that each row, column, and 3×3 box contains the digits 1-9 exactly once. 
            Gray cells are fixed and cannot be changed.
          </p>
        </div>
      </div>
      
      <SudokuGrid
        grid={grid}
        initial={gameData.initial}
        onCellChange={handleCellChange}
      />
      
      {isComplete && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl shadow-lg">
          <div className="flex items-center justify-center">
            <div className="text-4xl mr-4">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-green-800 mb-1">Puzzle Completed!</h3>
              <p className="text-green-700">
                Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}, 
                Mistakes: {mistakes}. Check your wallet for coins!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


