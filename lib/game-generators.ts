// Sudoku Generator
export function generateSudoku(difficulty: 'easy' | 'medium' | 'hard') {
    const emptyGrid = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // Generate a solved Sudoku
    const solution = solveSudoku(emptyGrid);
    
    // Remove numbers based on difficulty
    const puzzle = removeNumbers(solution, difficulty);
    
    return {
      puzzle,
      solution,
      initial: JSON.parse(JSON.stringify(puzzle)) // Deep copy
    };
  }
  
  // Word Guesser Generator
  export function generateWordPuzzle(difficulty: 'easy' | 'medium' | 'hard') {
    const wordLists = {
      easy: ['APPLE', 'HOUSE', 'TIGER', 'RIVER', 'SMILE'],
      medium: ['PYTHON', 'JAVASCRIPT', 'REACT', 'DATABASE', 'NETWORK'],
      hard: ['ALGORITHM', 'CRYPTOGRAPHY', 'NEURALNETWORK', 'QUANTUMCOMPUTING']
    };
    
    const words = wordLists[difficulty];
    const word = words[Math.floor(Math.random() * words.length)];
    const scrambled = scrambleWord(word);
    
    return {
      puzzle: scrambled,
      solution: word,
      hint: `It has ${word.length} letters`
    };
  }
  
  // Crossword Generator (simplified)
//   export function generateCrossword(difficulty: 'easy' | 'medium' | 'hard') {
//     const size = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;
//     const grid = Array(size).fill(null).map(() => Array(size).fill(''));
    
//     // Simple crossword with 3 words
//     const words = ['HELLO', 'WORLD', 'CODE'];
//     const clues = [
//       { number: 1, direction: 'across', clue: 'A friendly greeting' },
//       { number: 2, direction: 'across', clue: 'Planet we live on' },
//       { number: 3, direction: 'down', clue: 'Programming language' }
//     ];
    
//     // Place words in grid (simplified logic)
//     words.forEach((word, index) => {
//       for (let i = 0; i < word.length; i++) {
//         if (index < 2) {
//           // Across words
//           grid[index][i] = { letter: '', correct: word[i] };
//         } else {
//           // Down word
//           if (grid[i] && grid[i][index - 2]) {
//             grid[i][index - 2] = { letter: '', correct: word[i] };
//           }
//         }
//       }
//     });
    
//     return {
//       puzzle: grid,
//       solution: grid.map(row => 
//         row.map(cell => ({ ...cell, letter: cell.correct }))
//       ),
//       clues,
//       size
//     };
//   }
  
  // Helper functions
  function solveSudoku(grid: number[][]) {
    // Sudoku solving logic (implement or use a library)
    return grid;
  }
  
  function removeNumbers(grid: number[][], difficulty: string) {
    const removalCount = {
      easy: 30,
      medium: 40,
      hard: 50
    };
    
    const puzzle = JSON.parse(JSON.stringify(grid));
    const cells = Array.from({ length: 81 }, (_, i) => i);
    
    for (let i = 0; i < removalCount[difficulty]; i++) {
      if (cells.length === 0) break;
      const index = Math.floor(Math.random() * cells.length);
      const cellIndex = cells[index];
      const row = Math.floor(cellIndex / 9);
      const col = cellIndex % 9;
      puzzle[row][col] = 0;
      cells.splice(index, 1);
    }
    
    return puzzle;
  }
  
  function scrambleWord(word: string) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  // Update the generateCrossword function
export function generateCrossword(difficulty: 'easy' | 'medium' | 'hard') {
    const size = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;
    
    // Define words based on difficulty
    const wordLists = {
      easy: [
        { word: 'HELLO', clue: 'A friendly greeting' },
        { word: 'WORLD', clue: 'Planet we live on' },
        { word: 'APPLE', clue: 'Red or green fruit' },
        { word: 'HOUSE', clue: 'Place where people live' },
        { word: 'SMILE', clue: 'Expression of happiness' }
      ],
      medium: [
        { word: 'PYTHON', clue: 'Programming language or snake' },
        { word: 'REACT', clue: 'JavaScript library for UI' },
        { word: 'DATABASE', clue: 'Organized collection of data' },
        { word: 'NETWORK', clue: 'System of connected computers' },
        { word: 'BROWSER', clue: 'Software for viewing websites' }
      ],
      hard: [
        { word: 'ALGORITHM', clue: 'Step-by-step procedure for calculations' },
        { word: 'CRYPTOGRAPHY', clue: 'Art of writing or solving codes' },
        { word: 'JAVASCRIPT', clue: 'Programming language for the web' },
        { word: 'FULLSTACK', clue: 'Developer working on both frontend and backend' },
        { word: 'CLOUDSERVICES', clue: 'Remote servers accessed over the internet' }
      ]
    };
  
    const words = wordLists[difficulty].slice(0, 3); // Use 3 words for simplicity
    const grid: Cell[][] = Array(size).fill(null).map(() => 
      Array(size).fill({ letter: '', correct: '', isBlack: true })
    );
  
    const clues: Array<{ number: number; direction: 'across' | 'down'; clue: string }> = [];
    let clueNumber = 1;
  
    // Helper function to check if a word fits
    const canPlaceWord = (word: string, row: number, col: number, direction: 'across' | 'down') => {
      if (direction === 'across' && col + word.length > size) return false;
      if (direction === 'down' && row + word.length > size) return false;
  
      for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        
        const currentCell = grid[r][c];
        if (!currentCell.isBlack && currentCell.correct !== word[i]) {
          return false;
        }
      }
      return true;
    };
  
    // Place words in the grid
    words.forEach(({ word, clue }) => {
      // Try to place word across
      const placed = tryPlaceWord(word, clue, clueNumber, 'across');
      if (placed) {
        clueNumber++;
        return;
      }
  
      // Try to place word down
      if (tryPlaceWord(word, clue, clueNumber, 'down')) {
        clueNumber++;
      }
    });
  
    function tryPlaceWord(word: string, clue: string, number: number, direction: 'across' | 'down'): boolean {
      const maxAttempts = 100;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        
        if (!canPlaceWord(word, row, col, direction)) continue;
        
        // Place the word
        for (let i = 0; i < word.length; i++) {
          const r = direction === 'across' ? row : row + i;
          const c = direction === 'across' ? col + i : col;
          
          grid[r][c] = {
            ...grid[r][c],
            letter: '',
            correct: word[i],
            isBlack: false,
            number: i === 0 ? number : undefined,
            across: direction === 'across' ? number : undefined,
            down: direction === 'down' ? number : undefined
          };
        }
        
        clues.push({
          number,
          direction,
          clue
        });
        
        return true;
      }
      
      return false;
    }
  
    // Fill remaining cells as black
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c].isBlack) {
          grid[r][c] = { letter: '', correct: '', isBlack: true };
        }
      }
    }
  
    return {
      puzzle: grid,
      solution: grid.map(row => 
        row.map(cell => ({
          ...cell,
          letter: cell.isBlack ? '' : cell.correct
        }))
      ),
      clues,
      size
    };
  }
  
  // Update Cell interface
  interface Cell {
    letter: string;
    correct: string;
    isBlack: boolean;
    number?: number;
    across?: number;
    down?: number;
  }