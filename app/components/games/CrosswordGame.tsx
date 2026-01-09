'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { auth } from '@/lib/firebase';

interface Cell {
  letter: string;
  correct: string;
  number?: number;
  isBlack?: boolean;
  across?: number;
  down?: number;
}

interface CrosswordGameProps {
  gameData: {
    gameId: string;
    puzzle: Cell[][];
    solution: Cell[][];
    clues: Array<{
      number: number;
      direction: 'across' | 'down';
      clue: string;
    }>;
    size: number;
    maxCoins?: number;
    hasTimeBonus?: boolean;
  };
  onComplete: (result: any) => void;
}

export default function CrosswordGame({ gameData, onComplete }: CrosswordGameProps) {
  const { user } = useAuth();
  const [grid, setGrid] = useState<Cell[][]>(gameData.puzzle);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [time, setTime] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [revealedCells, setRevealedCells] = useState(0);
  const [currentClue, setCurrentClue] = useState<{
    number: number;
    direction: 'across' | 'down';
    clue: string;
  } | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Initialize refs
  useEffect(() => {
    inputRefs.current = Array(gameData.size)
      .fill(null)
      .map(() => Array(gameData.size).fill(null));
  }, [gameData.size]);

  // Timer
  useEffect(() => {
    if (!gameComplete) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameComplete]);

  // Find clue for selected cell
  useEffect(() => {
    if (!selectedCell) {
      setCurrentClue(null);
      return;
    }

    const [row, col] = selectedCell;
    const cell = grid[row][col];
    
    if (cell.isBlack) return;

    const clueNumber = selectedDirection === 'across' ? cell.across : cell.down;
    if (!clueNumber) return;

    const clue = gameData.clues.find(c => 
      c.number === clueNumber && c.direction === selectedDirection
    );

    if (clue) {
      setCurrentClue(clue);
    }
  }, [selectedCell, selectedDirection, grid, gameData.clues]);

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.isBlack) return;

    // If clicking the same cell, toggle direction
    if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
      const cellHasAcross = cell.across !== undefined;
      const cellHasDown = cell.down !== undefined;
      
      if (cellHasAcross && cellHasDown) {
        setSelectedDirection(prev => prev === 'across' ? 'down' : 'across');
      }
    } else {
      // Select new cell
      setSelectedCell([row, col]);
      
      // Auto-select appropriate direction
      const cellHasAcross = cell.across !== undefined;
      const cellHasDown = cell.down !== undefined;
      
      if (cellHasAcross && !cellHasDown) {
        setSelectedDirection('across');
      } else if (cellHasDown && !cellHasAcross) {
        setSelectedDirection('down');
      }
    }

    // Focus the input
    setTimeout(() => {
      const inputEl = inputRefs.current[row]?.[col];
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 0);
  };

  const handleLetterInput = (row: number, col: number, letter: string) => {
    if (gameComplete || letter.length > 1) return;
    
    // Only allow letters
    if (letter && !/^[A-Za-z]$/.test(letter)) return;

    const newGrid = [...grid];
    const upperLetter = letter.toUpperCase();
    newGrid[row][col] = { ...newGrid[row][col], letter: upperLetter };
    setGrid(newGrid);

    // Check if this letter is incorrect
    if (upperLetter && upperLetter !== gameData.solution[row][col].letter) {
      setMistakes(prev => prev + 1);
    }

    // Auto-move to next cell if letter was entered
    if (letter) {
      setTimeout(() => {
        moveToNextCell(row, col);
      }, 10);
    }

    // Check completion
    checkCompletion(newGrid);
  };

  const moveToNextCell = (currentRow: number, currentCol: number) => {
    if (!selectedCell) return;

    const [selRow, selCol] = selectedCell;
    let nextRow = selRow;
    let nextCol = selCol;

    if (selectedDirection === 'across') {
      nextCol++;
      // Skip black cells
      while (nextCol < gameData.size && grid[selRow][nextCol]?.isBlack) {
        nextCol++;
      }
      if (nextCol >= gameData.size) {
        return; // Stay at current position
      }
    } else {
      nextRow++;
      // Skip black cells
      while (nextRow < gameData.size && grid[nextRow]?.[selCol]?.isBlack) {
        nextRow++;
      }
      if (nextRow >= gameData.size) {
        return; // Stay at current position
      }
    }

    // Ensure within bounds and valid cell
    if (nextRow < gameData.size && nextCol < gameData.size && 
        grid[nextRow]?.[nextCol] && !grid[nextRow][nextCol].isBlack) {
      setSelectedCell([nextRow, nextCol]);
      setTimeout(() => {
        const inputEl = inputRefs.current[nextRow]?.[nextCol];
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (gameComplete) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveDirection(row, col, -1, 0);
        setSelectedDirection('down');
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDirection(row, col, 1, 0);
        setSelectedDirection('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveDirection(row, col, 0, -1);
        setSelectedDirection('across');
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveDirection(row, col, 0, 1);
        setSelectedDirection('across');
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        const newGrid = [...grid];
        newGrid[row][col] = { ...newGrid[row][col], letter: '' };
        setGrid(newGrid);
        // Move back one cell on backspace if current cell is empty
        if (!grid[row][col].letter) {
          if (selectedDirection === 'across' && col > 0) {
            moveDirection(row, col, 0, -1);
          } else if (selectedDirection === 'down' && row > 0) {
            moveDirection(row, col, -1, 0);
          }
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
        } else {
          moveToNextCell(row, col);
        }
        break;
      case ' ':
        e.preventDefault();
        setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
        break;
    }
  };

  const moveDirection = (row: number, col: number, rowDelta: number, colDelta: number) => {
    let newRow = row + rowDelta;
    let newCol = col + colDelta;

    // Find next valid cell
    while (
      newRow >= 0 && newRow < gameData.size &&
      newCol >= 0 && newCol < gameData.size &&
      grid[newRow]?.[newCol]?.isBlack
    ) {
      newRow += rowDelta;
      newCol += colDelta;
    }

    if (
      newRow >= 0 && newRow < gameData.size &&
      newCol >= 0 && newCol < gameData.size &&
      grid[newRow]?.[newCol]
    ) {
      setSelectedCell([newRow, newCol]);
      setTimeout(() => {
        const inputEl = inputRefs.current[newRow]?.[newCol];
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }, 0);
    }
  };

  const checkCompletion = (currentGrid: Cell[][]) => {
    const isComplete = currentGrid.every((row, rowIndex) =>
      row.every((cell, colIndex) => {
        if (cell.isBlack) return true;
        return cell.letter && cell.letter === gameData.solution[rowIndex][colIndex].letter;
      })
    );

    if (isComplete && !gameComplete) {
      handleComplete(currentGrid);
    }
  };

  const handleComplete = async (completedGrid: Cell[][]) => {
    if (gameComplete) return; // Prevent double submission
    
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
          gameType: 'crossword',
          solution: completedGrid,
          timeSpent: time,
          metadata: {
            mistakes,
            revealedCells,
            gridSize: gameData.size
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
  };

  const handleCheckSolution = () => {
    const solutionGrid = gameData.solution;
    const newGrid = [...grid];
    let errorCount = 0;

    solutionGrid.forEach((row, rowIndex) => {
      row.forEach((solutionCell, colIndex) => {
        const userCell = newGrid[rowIndex][colIndex];
        if (!solutionCell.isBlack && userCell.letter) {
          if (userCell.letter !== solutionCell.letter) {
            errorCount++;
          }
        }
      });
    });

    if (errorCount === 0) {
      const allFilled = newGrid.every((row, rowIndex) =>
        row.every((cell, colIndex) => {
          if (gameData.solution[rowIndex][colIndex].isBlack) return true;
          return cell.letter !== '';
        })
      );
      
      if (allFilled) {
        handleComplete(newGrid);
      } else {
        alert('All cells are correct so far! Keep filling in the remaining cells.');
      }
    } else {
      alert(`You have ${errorCount} incorrect letter${errorCount !== 1 ? 's' : ''}. Keep trying!`);
    }
  };

  const handleRevealCell = () => {
    if (!selectedCell || gameComplete) return;
    
    const [row, col] = selectedCell;
    const solutionLetter = gameData.solution[row][col].letter;
    
    const newGrid = [...grid];
    newGrid[row][col] = { ...newGrid[row][col], letter: solutionLetter };
    setGrid(newGrid);
    setRevealedCells(prev => prev + 1);
    
    // Check if complete after reveal
    checkCompletion(newGrid);
    
    // Move to next cell
    moveToNextCell(row, col);
  };

  const getCellClass = (row: number, col: number) => {
    const cell = grid[row][col];
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    
    let isInWord = false;
    if (selectedCell && !cell.isBlack) {
      const selectedClueNum = selectedDirection === 'across' 
        ? grid[selectedCell[0]][selectedCell[1]].across 
        : grid[selectedCell[0]][selectedCell[1]].down;
      const currentClueNum = selectedDirection === 'across' ? cell.across : cell.down;
      isInWord = selectedClueNum === currentClueNum && selectedClueNum !== undefined;
    }

    const baseClasses = [
      'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
      'flex items-center justify-center',
      'border border-gray-300',
      'text-sm sm:text-base md:text-lg font-bold',
      'relative',
      'transition-colors duration-150'
    ];

    if (cell.isBlack) {
      baseClasses.push('bg-gray-900');
    } else if (isSelected) {
      baseClasses.push('bg-blue-300 ring-2 ring-blue-600 z-10');
    } else if (isInWord) {
      baseClasses.push('bg-blue-100');
    } else {
      baseClasses.push('bg-white hover:bg-gray-50 cursor-pointer');
    }

    return baseClasses.join(' ');
  };

  // Group clues by direction
  const acrossClues = gameData.clues.filter(clue => clue.direction === 'across');
  const downClues = gameData.clues.filter(clue => clue.direction === 'down');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Crossword Puzzle</h2>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="text-base md:text-lg font-semibold bg-blue-50 px-4 py-2 rounded-lg">
              ⏱️ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
            {mistakes > 0 && (
              <div className="text-base md:text-lg font-semibold bg-red-50 px-4 py-2 rounded-lg">
                ❌ {mistakes} mistakes
              </div>
            )}
            {revealedCells > 0 && (
              <div className="text-base md:text-lg font-semibold bg-yellow-50 px-4 py-2 rounded-lg">
                💡 {revealedCells} revealed
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-base sm:text-lg font-medium text-purple-800">
                Fill in all the white squares to complete the crossword!
              </p>
              <p className="text-purple-600 mt-1 text-sm">
                Use <kbd className="px-2 py-0.5 bg-white rounded font-mono text-xs">Tab</kbd> or <kbd className="px-2 py-0.5 bg-white rounded font-mono text-xs">Space</kbd> to switch direction
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="text-sm bg-white px-4 py-2 rounded-lg shadow">
                <span className="font-semibold text-purple-700">
                  Grid: {gameData.size} × {gameData.size}
                </span>
              </div>
              {gameData.maxCoins && (
                <div className="text-sm bg-amber-50 px-4 py-2 rounded-lg shadow border border-amber-200">
                  <span className="font-semibold text-amber-700">
                    🪙 Up to {gameData.maxCoins} coins
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">
        {/* Crossword Grid */}
        <div className="flex-1 lg:max-w-3xl">
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg mb-6">
            <div className="grid gap-0 w-fit mx-auto border-2 border-gray-700 rounded" 
                 style={{ gridTemplateColumns: `repeat(${gameData.size}, minmax(0, 1fr))` }}>
              {grid.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClass(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {!cell.isBlack && (
                      <>
                        {cell.number && (
                          <div className="absolute top-0 left-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-normal text-gray-600 leading-none">
                            {cell.number}
                          </div>
                        )}
                        <input
                          ref={el => {
                            if (inputRefs.current[rowIndex]) {
                              inputRefs.current[rowIndex][colIndex] = el;
                            }
                          }}
                          type="text"
                          value={cell.letter || ''}
                          onChange={(e) => handleLetterInput(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          disabled={gameComplete}
                          className="w-full h-full bg-transparent border-0 text-center text-sm sm:text-base md:text-lg font-bold uppercase focus:outline-none focus:ring-0 p-0"
                          maxLength={1}
                          aria-label={`Cell ${rowIndex + 1},${colIndex + 1}`}
                        />
                      </>
                    )}
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedDirection('across')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                selectedDirection === 'across'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Across →
            </button>
            <button
              onClick={() => setSelectedDirection('down')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                selectedDirection === 'down'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Down ↓
            </button>
            <button
              onClick={handleRevealCell}
              disabled={!selectedCell || gameComplete}
              className="px-3 sm:px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base transition-colors"
            >
              💡 Reveal
            </button>
            <button
              onClick={handleCheckSolution}
              disabled={gameComplete}
              className="px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base transition-colors"
            >
              ✓ Check
            </button>
          </div>
        </div>

        {/* Clues Panel */}
        <div className="w-full lg:w-96 xl:w-[420px]">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-6">
            {currentClue && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center mb-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mr-3">
                    {currentClue.number} {currentClue.direction === 'across' ? 'Across' : 'Down'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Selected clue
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-800 italic border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                  "{currentClue.clue}"
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 pb-2 border-b">
                  Across
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {acrossClues.map((clue) => (
                    <button
                      key={`across-${clue.number}`}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        currentClue?.number === clue.number && 
                        currentClue.direction === 'across' 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        for (let r = 0; r < gameData.size; r++) {
                          for (let c = 0; c < gameData.size; c++) {
                            const cell = grid[r][c];
                            if (cell.number === clue.number && cell.across) {
                              setSelectedCell([r, c]);
                              setSelectedDirection('across');
                              return;
                            }
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-blue-600 w-5 sm:w-6 flex-shrink-0">
                          {clue.number}.
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 flex-1">{clue.clue}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 pb-2 border-b">
                  Down
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {downClues.map((clue) => (
                    <button
                      key={`down-${clue.number}`}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        currentClue?.number === clue.number && 
                        currentClue.direction === 'down' 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        for (let r = 0; r < gameData.size; r++) {
                          for (let c = 0; c < gameData.size; c++) {
                            const cell = grid[r][c];
                            if (cell.number === clue.number && cell.down) {
                              setSelectedCell([r, c]);
                              setSelectedDirection('down');
                              return;
                            }
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-blue-600 w-5 sm:w-6 flex-shrink-0">
                          {clue.number}.
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 flex-1">{clue.clue}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {gameComplete && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-center">
            <div className="text-4xl mr-4">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-green-800 mb-1">Crossword Completed!</h3>
              <p className="text-green-700">
                Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}, 
                Mistakes: {mistakes}, Revealed: {revealedCells}.
                Coins have been added to your wallet!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}