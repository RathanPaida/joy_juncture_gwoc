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
  const [notesMode, setNotesMode] = useState(false);

  const handleCellClick = (row: number, col: number) => {
    if (initial[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    
    if (notesMode) {
      handleNoteInput(num);
    } else {
      // Clear notes for this cell when entering a number
      const key = `${row},${col}`;
      if (notes[key]) {
        const newNotes = { ...notes };
        delete newNotes[key];
        setNotes(newNotes);
      }
      
      onCellChange(row, col, num);
    }
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
      if (newNotes[key].size === 0) {
        delete newNotes[key];
      }
    } else {
      newNotes[key].add(num);
    }
    
    setNotes(newNotes);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    
    // Clear both number and notes
    const key = `${row},${col}`;
    if (notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }
    
    onCellChange(row, col, 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    const key = e.key;
    
    if (key >= '1' && key <= '9') {
      e.preventDefault();
      handleNumberInput(parseInt(key));
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
      e.preventDefault();
      handleClearCell();
    } else if (key === 'Escape') {
      setSelectedCell(null);
    } else if (key === 'n' || key === 'N') {
      e.preventDefault();
      setNotesMode(!notesMode);
    } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault();
      moveSelection(key);
    }
  };

  const moveSelection = (key: string) => {
    if (!selectedCell) return;
    
    let [row, col] = selectedCell;
    
    switch (key) {
      case 'ArrowUp':
        row = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        row = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        col = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        col = Math.min(8, col + 1);
        break;
    }
    
    // Skip fixed cells if moving
    while (initial[row][col] !== 0) {
      switch (key) {
        case 'ArrowUp':
          row--;
          if (row < 0) return;
          break;
        case 'ArrowDown':
          row++;
          if (row > 8) return;
          break;
        case 'ArrowLeft':
          col--;
          if (col < 0) return;
          break;
        case 'ArrowRight':
          col++;
          if (col > 8) return;
          break;
      }
    }
    
    setSelectedCell([row, col]);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, notesMode, notes]);

  const getCellClass = (row: number, col: number) => {
    const classes = [
      'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14',
      'flex items-center justify-center',
      'border border-gray-300',
      'text-base sm:text-lg md:text-xl font-semibold',
      'transition-all duration-150',
      'select-none',
      'cursor-pointer'
    ];

    // Add thicker borders for 3x3 blocks
    if (row % 3 === 0) classes.push('border-t-2 border-t-gray-700');
    if (col % 3 === 0) classes.push('border-l-2 border-l-gray-700');
    if (row === 8) classes.push('border-b-2 border-b-gray-700');
    if (col === 8) classes.push('border-r-2 border-r-gray-700');

    // Selected cell styling
    if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
      classes.push('bg-blue-200 ring-2 ring-blue-500 z-10');
    } else if (selectedCell) {
      // Highlight same row, column, or block
      const [selRow, selCol] = selectedCell;
      const sameRow = selRow === row;
      const sameCol = selCol === col;
      const sameBlock = Math.floor(selRow / 3) === Math.floor(row / 3) && 
                       Math.floor(selCol / 3) === Math.floor(col / 3);
      
      // Also highlight same number
      const sameNumber = grid[row][col] !== 0 && grid[row][col] === grid[selRow][selCol];
      
      if (sameNumber) {
        classes.push('bg-blue-100 border-blue-300');
      } else if (sameRow || sameCol || sameBlock) {
        classes.push('bg-blue-50');
      }
    }

    // Pre-filled cells (from initial puzzle)
    if (initial[row][col] !== 0) {
      classes.push('bg-gray-200 text-gray-900 font-bold cursor-not-allowed');
    } else if (grid[row][col] !== 0) {
      classes.push('bg-white text-blue-600');
    } else {
      classes.push('bg-white text-gray-600');
    }

    // Conflict detection (same number in row, column, or block)
    const value = grid[row][col];
    if (value !== 0 && initial[row][col] === 0) {
      let hasConflict = false;
      
      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === value) {
          hasConflict = true;
          break;
        }
      }
      
      // Check column
      if (!hasConflict) {
        for (let r = 0; r < 9; r++) {
          if (r !== row && grid[r][col] === value) {
            hasConflict = true;
            break;
          }
        }
      }
      
      // Check 3x3 block
      if (!hasConflict) {
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        for (let r = blockRow; r < blockRow + 3; r++) {
          for (let c = blockCol; c < blockCol + 3; c++) {
            if ((r !== row || c !== col) && grid[r][c] === value) {
              hasConflict = true;
              break;
            }
          }
          if (hasConflict) break;
        }
      }
      
      if (hasConflict) {
        classes.push('bg-red-100 text-red-600 border-red-400');
      }
    }

    return classes.join(' ');
  };

  const renderCellContent = (row: number, col: number) => {
    const value = grid[row][col];
    
    if (value !== 0) {
      return <span className="text-center">{value}</span>;
    }
    
    const key = `${row},${col}`;
    if (notes[key] && notes[key].size > 0) {
      return (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 gap-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="flex items-center justify-center text-[8px] sm:text-[9px] md:text-[10px]">
              {notes[key].has(num) && (
                <span className="text-gray-500 font-normal">{num}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sudoku Board */}
      <div className="flex-1">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="grid grid-cols-9 w-fit mx-auto border-2 border-gray-700 rounded">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClass(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {renderCellContent(rowIndex, colIndex)}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg sticky top-6">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Controls</h3>
          
          {/* Mode Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setNotesMode(!notesMode)}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                notesMode 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {notesMode ? '📝 Notes Mode (ON)' : '✏️ Number Mode'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press 'N' to toggle • Currently: {notesMode ? 'Adding notes' : 'Entering numbers'}
            </p>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3 font-medium">Enter Numbers (1-9):</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className={`h-12 sm:h-14 rounded-lg transition-all font-semibold text-lg ${
                    notesMode
                      ? 'bg-purple-50 border-2 border-purple-200 text-purple-700 hover:bg-purple-100'
                      : 'bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-400'
                  }`}
                  onClick={() => handleNumberInput(num)}
                  disabled={!selectedCell}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              onClick={handleClearCell}
              disabled={!selectedCell}
            >
              🗑️ Clear Cell
            </button>
            
            <button
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              onClick={() => setSelectedCell(null)}
            >
              ◻️ Deselect
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Keyboard Shortcuts:</p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">1-9</kbd> Enter number</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">N</kbd> Toggle notes mode</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">←↑→↓</kbd> Move selection</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">Backspace</kbd> Clear cell</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">Esc</kbd> Deselect</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">💡 Tips:</p>
            <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
              <li>• Red cells have conflicts</li>
              <li>• Gray cells are fixed</li>
              <li>• Blue highlights show related cells</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}