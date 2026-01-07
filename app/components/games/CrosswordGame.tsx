'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
  const [currentClue, setCurrentClue] = useState<{
    number: number;
    direction: 'across' | 'down';
    clue: string;
  } | null>(null);
  
  const inputRefs = useRef<HTMLInputElement[][]>([]);

  // Initialize refs
  useEffect(() => {
    inputRefs.current = Array(gameData.size)
      .fill(null)
      .map(() => Array(gameData.size).fill(null));
  }, [gameData.size]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameComplete) {
        setTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
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

    const clueNumber = cell.number;
    if (!clueNumber) return;

    const clue = gameData.clues.find(c => 
      c.number === clueNumber && 
      ((selectedDirection === 'across' && c.direction === 'across') || 
       (selectedDirection === 'down' && c.direction === 'down'))
    );

    if (clue) {
      setCurrentClue(clue);
    }
  }, [selectedCell, selectedDirection, grid, gameData.clues]);

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.isBlack) return;

    setSelectedCell([row, col]);
    
    // Auto-select direction based on available clues
    const cellHasAcross = cell.across !== undefined;
    const cellHasDown = cell.down !== undefined;
    
    if (cellHasAcross && cellHasDown) {
      // Keep current direction or switch if clicked cell is different
      if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
        // Switch direction on same cell click
        setSelectedDirection(prev => prev === 'across' ? 'down' : 'across');
      }
    } else if (cellHasAcross) {
      setSelectedDirection('across');
    } else if (cellHasDown) {
      setSelectedDirection('down');
    }

    // Focus the input
    setTimeout(() => {
      if (inputRefs.current[row] && inputRefs.current[row][col]) {
        inputRefs.current[row][col]?.focus();
        inputRefs.current[row][col]?.select();
      }
    }, 0);
  };

  const handleLetterInput = (row: number, col: number, letter: string) => {
    if (gameComplete || letter.length > 1 || !/^[A-Za-z]$/.test(letter)) return;

    const newGrid = [...grid];
    newGrid[row][col] = { ...newGrid[row][col], letter: letter.toUpperCase() };
    setGrid(newGrid);

    // Auto-move to next cell
    setTimeout(() => {
      moveToNextCell(row, col);
    }, 10);

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
      // Find next non-black cell in same row
      while (nextCol < gameData.size && grid[selRow][nextCol]?.isBlack) {
        nextCol++;
      }
      if (nextCol >= gameData.size) {
        // Move to next row or wrap
        nextRow++;
        nextCol = 0;
        while (nextRow < gameData.size && grid[nextRow] && 
               (grid[nextRow][nextCol]?.isBlack || !grid[nextRow][nextCol])) {
          nextCol++;
          if (nextCol >= gameData.size) {
            nextRow++;
            nextCol = 0;
          }
        }
      }
    } else {
      nextRow++;
      // Find next non-black cell in same column
      while (nextRow < gameData.size && grid[nextRow] && 
             (grid[nextRow][selCol]?.isBlack || !grid[nextRow][selCol])) {
        nextRow++;
      }
      if (nextRow >= gameData.size) {
        // Move to next column or wrap
        nextRow = 0;
        nextCol++;
        while (nextCol < gameData.size && grid[nextRow] && 
               (grid[nextRow][nextCol]?.isBlack || !grid[nextRow][nextCol])) {
          nextRow++;
          if (nextRow >= gameData.size) {
            nextRow = 0;
            nextCol++;
          }
        }
      }
    }

    // Ensure within bounds and not black cell
    if (nextRow < gameData.size && nextCol < gameData.size && 
        grid[nextRow] && grid[nextRow][nextCol] && !grid[nextRow][nextCol].isBlack) {
      setSelectedCell([nextRow, nextCol]);
      setTimeout(() => {
        if (inputRefs.current[nextRow] && inputRefs.current[nextRow][nextCol]) {
          inputRefs.current[nextRow][nextCol]?.focus();
          inputRefs.current[nextRow][nextCol]?.select();
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
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDirection(row, col, 1, 0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveDirection(row, col, 0, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveDirection(row, col, 0, 1);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        const newGrid = [...grid];
        newGrid[row][col] = { ...newGrid[row][col], letter: '' };
        setGrid(newGrid);
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
      grid[newRow] && grid[newRow][newCol] && 
      grid[newRow][newCol].isBlack
    ) {
      newRow += rowDelta;
      newCol += colDelta;
    }

    if (
      newRow >= 0 && newRow < gameData.size &&
      newCol >= 0 && newCol < gameData.size &&
      grid[newRow] && grid[newRow][newCol]
    ) {
      setSelectedCell([newRow, newCol]);
      setSelectedDirection(rowDelta !== 0 ? 'down' : 'across');
      setTimeout(() => {
        if (inputRefs.current[newRow] && inputRefs.current[newRow][newCol]) {
          inputRefs.current[newRow][newCol]?.focus();
          inputRefs.current[newRow][newCol]?.select();
        }
      }, 0);
    }
  };

  const checkCompletion = (currentGrid: Cell[][]) => {
    const isComplete = currentGrid.every((row, rowIndex) =>
      row.every((cell, colIndex) => {
        if (cell.isBlack) return true;
        return cell.letter === gameData.solution[rowIndex][colIndex].letter;
      })
    );

    if (isComplete && !gameComplete) {
      handleComplete(currentGrid);
    }
  };

  const handleComplete = async (completedGrid: Cell[][]) => {
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

  const handleCheckSolution = () => {
    const solutionGrid = gameData.solution;
    const newGrid = [...grid];
    let hasErrors = false;

    solutionGrid.forEach((row, rowIndex) => {
      row.forEach((solutionCell, colIndex) => {
        const userCell = newGrid[rowIndex][colIndex];
        if (!solutionCell.isBlack && userCell.letter) {
          if (userCell.letter === solutionCell.letter) {
            // Correct - mark as correct (optional visual feedback)
            userCell.correct = solutionCell.letter;
          } else {
            // Incorrect - mark as incorrect
            hasErrors = true;
            // You could add visual feedback here
          }
        }
      });
    });

    setGrid(newGrid);
    
    if (!hasErrors) {
      handleComplete(newGrid);
    }
  };

  const handleRevealCell = () => {
    if (!selectedCell || gameComplete) return;
    
    const [row, col] = selectedCell;
    const solutionLetter = gameData.solution[row][col].letter;
    
    const newGrid = [...grid];
    newGrid[row][col] = { ...newGrid[row][col], letter: solutionLetter };
    setGrid(newGrid);
    
    // Check if complete after reveal
    checkCompletion(newGrid);
    
    // Move to next cell
    moveToNextCell(row, col);
  };

  const getCellClass = (row: number, col: number) => {
    const cell = grid[row][col];
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isInWord = selectedCell && (
      (selectedDirection === 'across' && cell.across === grid[selectedCell[0]][selectedCell[1]].across) ||
      (selectedDirection === 'down' && cell.down === grid[selectedCell[0]][selectedCell[1]].down)
    );

    const baseClasses = [
      'w-10 h-10 md:w-12 md:h-12',
      'flex items-center justify-center',
      'border border-gray-300',
      'text-lg font-bold',
      'relative'
    ];

    if (cell.isBlack) {
      baseClasses.push('bg-gray-800');
    } else if (isSelected) {
      baseClasses.push('bg-blue-200 ring-2 ring-blue-500');
    } else if (isInWord) {
      baseClasses.push('bg-blue-50');
    } else {
      baseClasses.push('bg-white');
    }

    // Add red border for incorrect cells (optional feature)
    if (!cell.isBlack && cell.letter && cell.letter !== gameData.solution[row][col].letter) {
      baseClasses.push('border-2 border-red-500');
    }

    return baseClasses.join(' ');
  };

  // Group clues by direction
  const acrossClues = gameData.clues.filter(clue => clue.direction === 'across');
  const downClues = gameData.clues.filter(clue => clue.direction === 'down');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Crossword Puzzle</h2>
          <div className="text-lg font-semibold">
            Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-purple-800">
                Fill in all the white squares to complete the crossword!
              </p>
              <p className="text-purple-600 mt-1">
                Use <span className="font-semibold">Tab</span> or <span className="font-semibold">Space</span> to switch direction
              </p>
            </div>
            <div className="text-sm bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-semibold text-purple-700">
                Grid: {gameData.size} × {gameData.size}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Crossword Grid */}
        <div className="lg:flex-1">
          <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
            <div className="grid gap-0.5 w-fit mx-auto" 
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
                          <div className="absolute top-0.5 left-0.5 text-xs font-normal text-gray-600">
                            {cell.number}
                          </div>
                        )}
                        <input
                          ref={el => {
                            if (inputRefs.current[rowIndex]) {
                              inputRefs.current[rowIndex][colIndex] = el!;
                            }
                          }}
                          type="text"
                          value={cell.letter || ''}
                          onChange={(e) => handleLetterInput(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          disabled={gameComplete}
                          className="w-full h-full bg-transparent border-0 text-center text-lg font-bold uppercase focus:outline-none focus:ring-0"
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
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setSelectedDirection('across')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedDirection === 'across'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Across →
            </button>
            <button
              onClick={() => setSelectedDirection('down')}
              className={`px-4 py-2 rounded-lg font-medium ${
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
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              💡 Reveal Letter
            </button>
            <button
              onClick={handleCheckSolution}
              disabled={gameComplete}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ✓ Check Solution
            </button>
          </div>
        </div>

        {/* Clues Panel */}
        <div className="lg:w-96">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            {currentClue ? (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold mr-3">
                    {currentClue.number} {currentClue.direction === 'across' ? 'Across' : 'Down'}
                  </span>
                  <span className="text-gray-600">
                    Selected cell clue
                  </span>
                </div>
                <p className="text-lg text-gray-800 italic border-l-4 border-blue-500 pl-4 py-2">
                  "{currentClue.clue}"
                </p>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700">
                  Click on any white square to see the clue.
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-3 pb-2 border-b">
                  Across Clues
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {acrossClues.map((clue) => (
                    <div
                      key={`across-${clue.number}`}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                        currentClue?.number === clue.number && 
                        currentClue.direction === 'across' 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : ''
                      }`}
                      onClick={() => {
                        // Find first cell with this clue number for across
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
                      <div className="flex items-start">
                        <span className="text-sm font-semibold text-blue-600 w-6">{clue.number}.</span>
                        <span className="text-sm text-gray-700 flex-1">{clue.clue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-3 pb-2 border-b">
                  Down Clues
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {downClues.map((clue) => (
                    <div
                      key={`down-${clue.number}`}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                        currentClue?.number === clue.number && 
                        currentClue.direction === 'down' 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : ''
                      }`}
                      onClick={() => {
                        // Find first cell with this clue number for down
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
                      <div className="flex items-start">
                        <span className="text-sm font-semibold text-blue-600 w-6">{clue.number}.</span>
                        <span className="text-sm text-gray-700 flex-1">{clue.clue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Controls Guide:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <span className="font-semibold">Click</span> on a cell to select it</li>
                <li>• <span className="font-semibold">Type letters</span> to fill cells</li>
                <li>• <span className="font-semibold">Arrow keys</span> to move between cells</li>
                <li>• <span className="font-semibold">Tab/Space</span> to switch direction</li>
                <li>• <span className="font-semibold">Backspace</span> to clear a cell</li>
                <li>• <span className="font-semibold">Click clues</span> to jump to that word</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {gameComplete && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl shadow-lg">
          <div className="flex items-center justify-center">
            <div className="text-4xl mr-4">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-green-800 mb-1">Crossword Completed!</h3>
              <p className="text-green-700">
                All letters are correct! Coins have been added to your wallet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}