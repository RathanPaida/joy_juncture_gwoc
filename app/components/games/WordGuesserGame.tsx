'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

interface WordGuesserGameProps {
  gameData: {
    gameId: string;
    puzzle: string;
    solution: string;
    hint?: string;
  };
  onComplete: (result: any) => void;
}

export default function WordGuesserGame({ gameData, onComplete }: WordGuesserGameProps) {
  const { user } = useAuth();
  const [time, setTime] = useState(0);
  const [input, setInput] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxHints = 3;
  const maxTime = 300; // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (input.toUpperCase() === gameData.solution) {
      setGameComplete(true);
      
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/games/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gameId: gameData.gameId,
            solution: input,
            timeSpent: time,
            metadata: { hintsUsed }
          })
        });
        
        const result = await response.json();
        onComplete(result);
      } catch (error) {
        console.error('Error completing game:', error);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleHint = () => {
    if (hintsUsed < maxHints) {
      setHintsUsed(hintsUsed + 1);
      
      // Reveal a random letter
      const solution = gameData.solution;
      const unrevealed = solution.split('').map((letter, index) => 
        input[index] !== letter ? index : -1
      ).filter(index => index !== -1);
      
      if (unrevealed.length > 0) {
        const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        const newInput = input.split('');
        newInput[randomIndex] = solution[randomIndex];
        setInput(newInput.join(''));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Word Guesser</h2>
          <div className="text-lg font-semibold">
            Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-6">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-600 mb-2">Unscramble this word:</div>
            <div className={`text-4xl font-bold tracking-wider mb-6 ${shake ? 'animate-shake' : ''}`}>
              {gameData.puzzle.split('').map((letter, index) => (
                <span 
                  key={index} 
                  className="inline-block mx-1 px-2 py-1 bg-white rounded border-2 border-blue-200"
                >
                  {letter}
                </span>
              ))}
            </div>
            
            {gameData.hint && (
              <div className="text-blue-600 mb-4">
                💡 Hint: {gameData.hint}
              </div>
            )}
            
            <div className="text-sm text-gray-500 mb-6">
              Word length: {gameData.solution.length} letters
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter the correct word:
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              disabled={gameComplete}
              className="flex-1 px-4 py-3 text-xl font-semibold text-center uppercase border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={gameData.solution.length}
              placeholder="TYPE HERE"
            />
            <button
              onClick={handleSubmit}
              disabled={gameComplete}
              className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Submit
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handleHint}
            disabled={hintsUsed >= maxHints || gameComplete}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💡 Get Hint ({maxHints - hintsUsed} left)
          </button>
          
          <div className="text-sm text-gray-600">
            Hints used: {hintsUsed}/{maxHints}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">How to play:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Rearrange the scrambled letters to form a valid word</li>
          <li>• Each hint reveals one correct letter</li>
          <li>• Using fewer hints gives you bonus points</li>
          <li>• Faster completion earns extra coins</li>
        </ul>
      </div>

      {gameComplete && (
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 font-semibold text-center">
            🎉 Correct! The word was "{gameData.solution}". Coins added to your wallet!
          </p>
        </div>
      )}

      {/* Add CSS animation for shake */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}