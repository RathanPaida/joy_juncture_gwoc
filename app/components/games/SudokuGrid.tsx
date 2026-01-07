'use client';

import { useState, useEffect } from 'react';

interface SudokuGridProps {
  grid: number[][];
  initial: number[][];
  onCellChange: (row: number, col: number, value: number) => void;
}

export default function SudokuGrid({ grid, initial, onCellChange }: SudokuGridProps) {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [notes, setNotes] = useState<Record<string, Set<number>>>({});

  const handleCellClick = (row: number, col: number) => {
    if (initial[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    
    // Clear notes for this cell
    const key = `${row},${col}`;
    if (notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }
    
    onCellChange(row, col, num);
  };

  const handleNoteInput = (num: number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    const key = `${row},${col}`;
    
    const newNotes = { ...notes };
    if (!newNotes[key]) {
      newNotes[key] = new Set();
    }
    
    if (newNotes[key].has(num)) {
      newNotes[key].delete(num);
    } else {
      newNotes[key].add(num);
    }
    
    setNotes(newNotes);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    onCellChange(row, col, 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedCell) return;
    
    const key = e.key;
    if (key >= '1' && key <= '9') {
      handleNumberInput(parseInt(key));
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
      handleClearCell();
    } else if (key === 'Escape') {
      setSelectedCell(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell]);

  const getCellClass = (row: number, col: number) => {
    const classes = [
      'w-12 h-12 md:w-14 md:h-14',
      'flex items-center justify-center',
      'border border-gray-300',
      'text-lg md:text-xl font-semibold',
      'transition-all duration-150',
      'select-none'
    ];

    // Add thicker borders for 3x3 blocks
    if (row % 3 === 0) classes.push('border-t-2 border-t-gray-600');
    if (col % 3 === 0) classes.push('border-l-2 border-l-gray-600');
    if (row === 8) classes.push('border-b-2 border-b-gray-600');
    if (col === 8) classes.push('border-r-2 border-r-gray-600');

    // Selected cell styling
    if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
      classes.push('bg-blue-200 ring-2 ring-blue-400');
    } else if (selectedCell) {
      // Highlight same row, column, or block
      const [selRow, selCol] = selectedCell;
      const sameRow = selRow === row;
      const sameCol = selCol === col;
      const sameBlock = Math.floor(selRow / 3) === Math.floor(row / 3) && 
                       Math.floor(selCol / 3) === Math.floor(col / 3);
      
      if (sameRow || sameCol || sameBlock) {
        classes.push('bg-blue-50');
      }
    }

    // Pre-filled cells (from initial puzzle)
    if (initial[row][col] !== 0) {
      classes.push('bg-gray-100 text-gray-800');
    } else if (grid[row][col] !== 0) {
      classes.push('text-blue-600');
    } else {
      classes.push('text-gray-600');
    }

    // Conflict detection (same number in row, column, or block)
    const value = grid[row][col];
    if (value !== 0) {
      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === value) {
          classes.push('bg-red-100 text-red-600');
          break;
        }
      }
      
      // Check column
      for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col] === value) {
          classes.push('bg-red-100 text-red-600');
          break;
        }
      }
      
      // Check 3x3 block
      const blockRow = Math.floor(row / 3) * 3;
      const blockCol = Math.floor(col / 3) * 3;
      for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
          if (r !== row && c !== col && grid[r][c] === value) {
            classes.push('bg-red-100 text-red-600');
            break;
          }
        }
      }
    }

    return classes.join(' ');
  };

  const renderCellContent = (row: number, col: number) => {
    const value = grid[row][col];
    
    if (value !== 0) {
      return value;
    }
    
    const key = `${row},${col}`;
    if (notes[key] && notes[key].size > 0) {
      return (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="flex items-center justify-center">
              {notes[key].has(num) && (
                <span className="text-xs text-gray-500">{num}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return '';
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sudoku Board */}
      <div className="flex-1">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="grid grid-cols-9 w-fit mx-auto">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClass(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={initial[rowIndex][colIndex] !== 0}
                >
                  {renderCellContent(rowIndex, colIndex)}
                </button>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full md:w-64">
        <div className="bg-gray-50 p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Controls</h3>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Enter Numbers:</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="w-12 h-12 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-lg font-semibold"
                  onClick={() => handleNumberInput(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Notes Mode:</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={`note-${num}`}
                  className="w-12 h-12 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-500"
                  onClick={() => handleNoteInput(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click to add/remove notes for selected cell
            </p>
          </div>

          <div className="space-y-2">
            <button
              className="w-full py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              onClick={handleClearCell}
              disabled={!selectedCell}
            >
              Clear Cell
            </button>
            
            <button
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              onClick={() => setSelectedCell(null)}
            >
              Deselect Cell
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">Tips:</p>
            <ul className="text-xs text-gray-600 mt-2 space-y-1">
              <li>• Click on empty cells to select</li>
              <li>• Use keyboard 1-9 to enter numbers</li>
              <li>• Red cells indicate conflicts</li>
              <li>• Gray cells are pre-filled (cannot be changed)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}