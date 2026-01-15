'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { auth } from '@/lib/firebase';

interface WordGuesserGameProps {
  gameData: {
    gameId: string;
    puzzle: string;
    solution: string;
    hint?: string;
    maxCoins?: number;
    hasTimeBonus?: boolean;
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
  const [attempts, setAttempts] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const maxHints = 3;

  useEffect(() => {
    if (!gameComplete) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameComplete]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (gameComplete || !input.trim()) return;
    
    setAttempts(prev => prev + 1);
    
    if (input.toUpperCase() === gameData.solution.toUpperCase()) {
      setGameComplete(true);
      
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
            gameType: 'word-guesser',
            solution: input,
            timeSpent: time,
            metadata: { 
              hintsUsed,
              attempts,
              revealedLetterCount: revealedLetters.size
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
        setGameComplete(false);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      // Optional: Show feedback
      if (attempts >= 2) {
        // After 2 failed attempts, consider showing which letters are correct
      }
    }
  };

  const handleHint = () => {
    if (hintsUsed >= maxHints || gameComplete) return;
    
    setHintsUsed(hintsUsed + 1);
    
    // Find unrevealed letters
    const solution = gameData.solution.toUpperCase();
    const currentInput = input.toUpperCase();
    const unrevealed: number[] = [];
    
    for (let i = 0; i < solution.length; i++) {
      if (!revealedLetters.has(i) && currentInput[i] !== solution[i]) {
        unrevealed.push(i);
      }
    }
    
    if (unrevealed.length > 0) {
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      const newRevealedLetters = new Set(revealedLetters);
      newRevealedLetters.add(randomIndex);
      setRevealedLetters(newRevealedLetters);
      
      // Update input with revealed letter
      const newInput = input.split('');
      while (newInput.length < solution.length) {
        newInput.push('');
      }
      newInput[randomIndex] = solution[randomIndex];
      setInput(newInput.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getLetterClass = (index: number) => {
    const baseClass = "inline-flex items-center justify-center w-10 h-12 sm:w-12 sm:h-14 mx-0.5 sm:mx-1 text-xl sm:text-2xl font-bold uppercase border-2 rounded-lg transition-all";
    
    if (revealedLetters.has(index)) {
      return `${baseClass} bg-green-50 border-green-400 text-green-700`;
    }
    
    return `${baseClass} bg-white border-blue-300 text-gray-800`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Word Guesser</h2>
          <div className="flex gap-3 items-center">
            <div className="text-lg font-semibold bg-blue-50 px-4 py-2 rounded-lg">
              ⏱️ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-lg font-semibold bg-purple-50 px-4 py-2 rounded-lg">
              🎯 {attempts} attempts
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-6">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-600 mb-3">Unscramble this word:</div>
            <div className={`flex justify-center items-center mb-6 ${shake ? 'animate-shake' : ''}`}>
              {gameData.puzzle.split('').map((letter, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center justify-center w-10 h-12 sm:w-12 sm:h-14 mx-0.5 sm:mx-1 text-xl sm:text-2xl font-bold bg-white rounded-lg border-2 border-blue-200 shadow-sm"
                >
                  {letter}
                </span>
              ))}
            </div>
            
            {gameData.hint && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
                <span className="text-blue-800 font-medium">
                  💡 Hint: {gameData.hint}
                </span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center items-center text-sm text-gray-600">
              <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                📏 Length: {gameData.solution.length} letters
              </span>
              {gameData.maxCoins && (
                <span className="bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-amber-700 font-medium">
                  🪙 Reward: Up to {gameData.maxCoins} coins
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Enter the correct word:
          </label>
          
          {/* Visual letter boxes */}
          <div className="flex justify-center mb-4">
            {gameData.solution.split('').map((_, index) => (
              <div key={index} className={getLetterClass(index)}>
                {input[index]?.toUpperCase() || ''}
              </div>
            ))}
          </div>
          
          {/* Text input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              disabled={gameComplete}
              className="flex-1 px-4 py-3 text-xl font-semibold text-center uppercase border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={gameData.solution.length}
              placeholder="TYPE HERE"
            />
            <button
              onClick={handleSubmit}
              disabled={gameComplete || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              Submit
            </button>
          </div>
          
          {attempts > 0 && !gameComplete && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              {attempts === 1 ? 'First attempt - try again!' : `${attempts} attempts so far`}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={handleHint}
            disabled={hintsUsed >= maxHints || gameComplete}
            className="px-5 py-2.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            💡 Get Hint ({maxHints - hintsUsed} left)
          </button>
          
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              Hints used: <span className="font-semibold text-yellow-700">{hintsUsed}/{maxHints}</span>
            </span>
            {revealedLetters.size > 0 && (
              <span className="text-gray-600">
                Letters revealed: <span className="font-semibold text-green-700">{revealedLetters.size}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <span className="text-lg mr-2">📖</span>
          How to play
        </h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Rearrange the scrambled letters to form a valid word</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Each hint reveals one correct letter in its position (green highlight)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Using fewer hints earns you more coins</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Faster completion with fewer attempts gives bonus rewards</span>
          </li>
        </ul>
      </div>

      {gameComplete && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-center">
            <div className="text-4xl mr-4">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-green-800 mb-1">Correct!</h3>
              <p className="text-green-700">
                The word was <span className="font-bold">"{gameData.solution}"</span>
              </p>
              <p className="text-green-600 text-sm mt-1">
                Completed in {attempts} {attempts === 1 ? 'attempt' : 'attempts'} 
                {hintsUsed > 0 && ` with ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}`}.
                Coins added to your wallet!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}