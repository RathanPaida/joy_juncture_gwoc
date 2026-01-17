"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Timer, RefreshCw, Trophy, CheckSquare,
  XSquare, Edit2, Zap, HelpCircle, Grid,
  Check, X, Gamepad2, Brain
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./sudoku-game.css";

/* ---------------- TYPES ---------------- */

interface User {
  _id: string;
  name: string;
}

interface SudokuCell {
  row: number;
  col: number;
  value: number | null;
  isOriginal: boolean;
  isCorrect: boolean | null;
}

const SUDOKU_GAME_ID = "sudoku";
const SUDOKU_GAME_NAME = "Sudoku Challenge";
const HINT_COUNT = 3;

/* ---------------- HELPER FUNCTIONS ---------------- */

/* ---------------- SUDOKU BOARD GENERATION ---------------- */

// Generate a valid Sudoku board
const generateValidBoard = (): number[][] => {
  // Start with an empty board
  const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes (they are independent)
  for (let box = 0; box < 9; box += 3) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let index = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[box + i][box + j] = numbers[index++];
      }
    }
  }

  // Fill remaining cells with backtracking
  const solve = (row: number, col: number): boolean => {
    if (row === 9) return true;
    if (col === 9) return solve(row + 1, 0);
    if (board[row][col] !== 0) return solve(row, col + 1);

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

    for (const num of numbers) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        if (solve(row, col + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  };

  solve(0, 0);
  return board;
};

// Check if a number is valid in a position
const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
};

// Create puzzle by removing numbers
const createPuzzle = (difficulty: 'easy' | 'medium' | 'hard'): { puzzle: number[][], solution: number[][] } => {
  const validBoard = generateValidBoard();
  const solution = validBoard.map(row => [...row]);
  const puzzle = validBoard.map(row => [...row]);

  // Remove cells based on difficulty
  let cellsToRemove;
  switch (difficulty) {
    case 'easy': cellsToRemove = 30; break;
    case 'medium': cellsToRemove = 40; break;
    case 'hard': cellsToRemove = 50; break;
    default: cellsToRemove = 40;
  }

  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }

  return { puzzle, solution };
};

/* ---------------- COMPONENT ---------------- */

export default function SudokuGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [board, setBoard] = useState<SudokuCell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------- GET TOKEN HELPER ---------------- */
  const getIdToken = async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
    }
  };

  /* ---------------- FETCH USER DATA HELPER ---------------- */
  const fetchUserData = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return null;

      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.user : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }, []);

  /* ---------------- AUTHENTICATION CHECK ---------------- */
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }

    const initUser = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setUser(userData);
        setLoading(false);
      } else {
        router.push("/login");
      }
    };

    initUser();
  }, [authUser, authLoading, router, fetchUserData]);

  /* ---------------- INITIALIZE GAME ---------------- */
  const initializeGame = useCallback((selectedDifficulty: 'easy' | 'medium' | 'hard' = difficulty) => {
    // Generate new Sudoku with selected difficulty
    const { puzzle, solution: sol } = createPuzzle(selectedDifficulty);

    // Convert to cell format
    const newBoard: SudokuCell[][] = [];
    for (let row = 0; row < 9; row++) {
      newBoard[row] = [];
      for (let col = 0; col < 9; col++) {
        newBoard[row][col] = {
          row,
          col,
          value: puzzle[row][col] || null,
          isOriginal: puzzle[row][col] !== 0,
          isCorrect: puzzle[row][col] !== 0 ? true : null
        };
      }
    }

    setBoard(newBoard);
    setSolution(sol);
    setSelectedCell(null);
    setTime(0);
    setGameStarted(false);
    setGameCompleted(false);
    setHintsUsed(0);
    setFeedback("");

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [difficulty]);

  useEffect(() => {
    if (user) {
      initializeGame();
    }
  }, [user, initializeGame]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameCompleted]);

  /* ---------------- GAME LOGIC ---------------- */
  const handleCellClick = (row: number, col: number) => {
    if (gameCompleted) return;
    if (board[row][col].isOriginal) return;

    if (!gameStarted) setGameStarted(true);
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameCompleted) return;
    if (board[selectedCell.row][selectedCell.col].isOriginal) return;

    const newBoard = [...board];
    const cell = newBoard[selectedCell.row][selectedCell.col];

    // Check if the number is correct
    const isCorrect = solution[selectedCell.row][selectedCell.col] === num;

    cell.value = num;
    cell.isCorrect = isCorrect;

    setBoard(newBoard);

    if (!isCorrect) {
      setFeedback("❌ Incorrect number!");
      setTimeout(() => setFeedback(""), 1500);
    } else {
      setFeedback("✅ Correct!");
      setTimeout(() => setFeedback(""), 1500);

      // Check if puzzle is complete
      const isComplete = newBoard.every(row =>
        row.every(cell => cell.value !== null && cell.isCorrect === true)
      );

      if (isComplete) {
        finishGame();
      }
    }
  };

  const useHint = () => {
    if (hintsUsed >= HINT_COUNT || gameCompleted) return;
    if (!selectedCell) {
      setFeedback("💡 Select a cell first!");
      setTimeout(() => setFeedback(""), 2000);
      return;
    }

    const newBoard = [...board];
    const cell = newBoard[selectedCell.row][selectedCell.col];

    if (cell.value === null) {
      cell.value = solution[selectedCell.row][selectedCell.col];
      cell.isCorrect = true;
      setBoard(newBoard);
      setHintsUsed(prev => prev + 1);

      // Check if puzzle is complete
      const isComplete = newBoard.every(row =>
        row.every(cell => cell.value !== null && cell.isCorrect === true)
      );

      if (isComplete) {
        finishGame();
      }
    }
  };

  const clearCell = () => {
    if (!selectedCell || gameCompleted) return;
    if (board[selectedCell.row][selectedCell.col].isOriginal) return;

    const newBoard = [...board];
    const cell = newBoard[selectedCell.row][selectedCell.col];
    cell.value = null;
    cell.isCorrect = null;
    setBoard(newBoard);
  };

  /* ---------------- FINISH GAME ---------------- */
  const finishGame = () => {
    setGameCompleted(true);
    setFeedback("🎉 Puzzle Complete! Well done!");
  };

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------------- UI RENDER ---------------- */
  if (authLoading) {
    return (
      <div className="sudoku-loading-screen">
        <div className="sudoku-loading-message">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sudoku-loading-screen">
        <div className="sudoku-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="sudoku-loading-screen">
        <div className="sudoku-loading-message">Redirecting to login...</div>
      </div>
    );
  }

  if (board.length === 0) {
    return (
      <div className="sudoku-loading-screen">
        <div className="sudoku-loading-message">Generating puzzle...</div>
      </div>
    );
  }

  return (
    <div className="sudoku-game-container">
      <div className="sudoku-game-wrapper">
        {/* Header */}
        <header className="sudoku-game-header">
          <div className="sudoku-header-card">
            <div className="sudoku-header-content">
              <div>
                <h1 className="sudoku-game-title">
                  <Brain className="sudoku-title-icon" />
                  Sudoku Challenge
                </h1>
                <p className="sudoku-welcome-message">
                  Welcome, <span className="sudoku-username">{user.name}</span>! Fill the grid correctly.
                </p>
              </div>
              <div className="sudoku-difficulty-selector">
                <select
                  value={difficulty}
                  onChange={(e) => {
                    const newDifficulty = e.target.value as 'easy' | 'medium' | 'hard';
                    setDifficulty(newDifficulty);
                    initializeGame(newDifficulty);
                  }}
                  className="sudoku-difficulty-select"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Game Stats */}
        <div className="sudoku-stats-container">
          <div className="sudoku-stats-grid">
            <div className="sudoku-stat-card sudoku-stat-time">
              <div className="sudoku-stat-header">
                <Timer className="sudoku-stat-icon" />
                <span className="sudoku-stat-label">Time</span>
              </div>
              <div className="sudoku-stat-value">{formatTime(time)}</div>
            </div>

            <div className="sudoku-stat-card sudoku-stat-hints">
              <div className="sudoku-stat-header">
                <HelpCircle className="sudoku-stat-icon" />
                <span className="sudoku-stat-label">Hints</span>
              </div>
              <div className="sudoku-stat-value">{HINT_COUNT - hintsUsed}</div>
            </div>

            <div className="sudoku-stat-card sudoku-stat-difficulty">
              <div className="sudoku-stat-header">
                <Trophy className="sudoku-stat-icon" />
                <span className="sudoku-stat-label">Difficulty</span>
              </div>
              <div className="sudoku-stat-value">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
            </div>

            <div className="sudoku-stat-card sudoku-stat-cells">
              <div className="sudoku-stat-header">
                <CheckSquare className="sudoku-stat-icon" />
                <span className="sudoku-stat-label">Completed</span>
              </div>
              <div className="sudoku-stat-value">
                {board.flat().filter(cell => cell.value !== null).length}/81
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`sudoku-feedback-message ${feedback.includes("✅") ? "success" :
              feedback.includes("❌") ? "error" :
              feedback.includes("🎉") ? "complete" :
                "hint"
              }`}>
              {feedback}
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="sudoku-controls-container">
          <div className="sudoku-controls-group">
            <button
              onClick={() => initializeGame()}
              className="sudoku-button sudoku-button-restart"
            >
              <RefreshCw className="sudoku-button-icon" />
              New Puzzle
            </button>

            <button
              onClick={useHint}
              disabled={hintsUsed >= HINT_COUNT || gameCompleted}
              className="sudoku-button sudoku-button-hint"
            >
              <HelpCircle className="sudoku-button-icon" />
              Use Hint ({HINT_COUNT - hintsUsed} left)
            </button>

            <button
              onClick={() => setNotesMode(!notesMode)}
              className={`sudoku-button ${notesMode ? 'sudoku-button-active' : 'sudoku-button-secondary'}`}
            >
              <Edit2 className="sudoku-button-icon" />
              {notesMode ? 'Notes Mode ON' : 'Notes Mode'}
            </button>

            <button
              onClick={clearCell}
              disabled={!selectedCell || gameCompleted}
              className="sudoku-button sudoku-button-secondary"
            >
              Clear Cell
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="sudoku-game-area">
          {/* Sudoku Board */}
          <div className="sudoku-board-section">
            <div className="sudoku-board-card">
              <div className="sudoku-board">
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="sudoku-row">
                    {row.map((cell, colIndex) => {
                      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                      const isSameRow = selectedCell?.row === rowIndex;
                      const isSameCol = selectedCell?.col === colIndex;
                      const boxRow = Math.floor(rowIndex / 3);
                      const boxCol = Math.floor(colIndex / 3);
                      const isSameBox = selectedCell &&
                        Math.floor(selectedCell.row / 3) === boxRow &&
                        Math.floor(selectedCell.col / 3) === boxCol;

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`sudoku-cell ${isSelected ? 'sudoku-cell-selected' : ''
                            } ${isSameRow || isSameCol || isSameBox ? 'sudoku-cell-highlighted' : ''
                            } ${cell.isOriginal ? 'sudoku-cell-original' : ''
                            } ${cell.isCorrect === false ? 'sudoku-cell-wrong' : ''
                            } ${cell.isCorrect === true ? 'sudoku-cell-correct' : ''
                            }`}
                          disabled={cell.isOriginal || gameCompleted}
                        >
                          {cell.value || ''}
                          {cell.isCorrect === false && <X className="sudoku-cell-status" />}
                          {cell.isCorrect === true && cell.value && <Check className="sudoku-cell-status" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Grid lines */}
                <div className="sudoku-grid-line horizontal-1"></div>
                <div className="sudoku-grid-line horizontal-2"></div>
                <div className="sudoku-grid-line vertical-1"></div>
                <div className="sudoku-grid-line vertical-2"></div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="sudoku-side-panel">
            {/* Number Pad */}
            <div className="sudoku-number-pad">
              <h3 className="sudoku-side-title">
                <Grid className="sudoku-side-icon" />
                Number Pad
              </h3>
              <div className="sudoku-numbers-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    disabled={!selectedCell || gameCompleted}
                    className="sudoku-number-button"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="sudoku-side-hint">
                Click a cell, then click a number to fill it
              </p>
            </div>

            {/* Instructions */}
            <div className="sudoku-instructions">
              <h3 className="sudoku-side-title">How to Play</h3>
              <ul className="sudoku-instructions-list">
                <li>Fill each row with numbers 1-9 (no repeats)</li>
                <li>Fill each column with numbers 1-9 (no repeats)</li>
                <li>Fill each 3x3 box with numbers 1-9 (no repeats)</li>
                <li>Use hints to reveal correct numbers</li>
                <li>No time limit - play at your own pace!</li>
              </ul>
            </div>

            {/* Game Info */}
            <div className="sudoku-game-info">
              <h3 className="sudoku-side-title">Game Info</h3>
              <div className="sudoku-info-grid">
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Difficulty</span>
                  <span className="sudoku-info-value">{difficulty}</span>
                </div>
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Hints Available</span>
                  <span className="sudoku-info-value">{HINT_COUNT}</span>
                </div>
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Cells to Fill</span>
                  <span className="sudoku-info-value">
                    {81 - board.flat().filter(cell => cell.isOriginal).length}
                  </span>
                </div>
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Status</span>
                  <span className="sudoku-info-value">
                    {gameCompleted ? 'Complete' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Completed Overlay */}
        {gameCompleted && (
          <div className="sudoku-completion-overlay">
            <div className="sudoku-completion-card">
              <div className="sudoku-completion-emoji">🎉</div>
              <h3 className="sudoku-completion-title">Puzzle Complete!</h3>
              <p className="sudoku-completion-text">
                Time: {formatTime(time)} • Hints Used: {hintsUsed}
              </p>
              <p className="sudoku-completion-message">
                Great job! You solved the {difficulty} Sudoku puzzle.
              </p>
              <div className="sudoku-completion-actions">
                <button
                  onClick={() => initializeGame()}
                  className="sudoku-button sudoku-button-primary"
                >
                  <RefreshCw className="sudoku-button-icon" />
                  Play Again
                </button>
                <button
                  onClick={() => router.push("/zone")}
                  className="sudoku-button sudoku-button-secondary"
                >
                  <Gamepad2 className="sudoku-button-icon" />
                  Game Zone
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}