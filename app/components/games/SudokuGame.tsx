"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Timer, RefreshCw, Trophy, CheckSquare,
  XSquare, Edit2, Zap, Lock, Coins, AlertCircle,
  HelpCircle, Grid, Check, X, Gamepad2
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./sudoku-game.css";

/* ---------------- TYPES ---------------- */

interface User {
  _id: string;
  name: string;
  userPoints: number;
  gamesPlayed?: Array<{
    gameId: string;
    gameName: string;
    playedAt: Date;
    score?: number;
    pointsEarned: number;
    completed: boolean;
  }>;
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
const MAX_MISTAKES = 3;
const BASE_COINS = 5;
const HINT_COUNT = 2;

/* ---------------- HELPER FUNCTIONS ---------------- */

const hasPlayedToday = (user: User | null, gameId: string): boolean => {
  if (!user || !user.gamesPlayed) return false;

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Check ALL records for this game, not just the first one found
  return user.gamesPlayed.some((game) => {
    if (game.gameId !== gameId) return false;

    const playedDate = new Date(game.playedAt);
    const playedUTC = new Date(Date.UTC(
      playedDate.getUTCFullYear(),
      playedDate.getUTCMonth(),
      playedDate.getUTCDate()
    ));

    return playedUTC.getTime() === todayUTC.getTime();
  });
};

const getNextPlayTime = (user: User | null, gameId: string): string => {
  if (!user || !user.gamesPlayed) return "Play Now";

  // Find the LATEST play record for this game
  const gameRecords = user.gamesPlayed
    .filter((game) => game.gameId === gameId)
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

  if (gameRecords.length === 0) return "Play Now";

  const lastPlayed = gameRecords[0];
  const playedDate = new Date(lastPlayed.playedAt);
  const playedUTC = new Date(Date.UTC(
    playedDate.getUTCFullYear(),
    playedDate.getUTCMonth(),
    playedDate.getUTCDate()
  ));

  const todayUTC = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  ));

  // If played today (or in future??), calculate time until tomorrow
  if (playedUTC.getTime() >= todayUTC.getTime()) {
    const tomorrowUTC = new Date(playedUTC);
    tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

    const nowUTC = new Date();
    const diff = tomorrowUTC.getTime() - nowUTC.getTime();

    if (diff <= 0) return "Play Now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  return "Play Now";
};

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

// Create puzzle by removing numbers (medium difficulty)
const createPuzzle = (board: number[][]): { puzzle: number[][], solution: number[][] } => {
  const solution = board.map(row => [...row]);
  const puzzle = board.map(row => [...row]);

  // Remove 50 cells for medium difficulty
  const cellsToRemove = 50;
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
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const [board, setBoard] = useState<SudokuCell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [time, setTime] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [feedback, setFeedback] = useState("");

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
        const playedToday = hasPlayedToday(userData, SUDOKU_GAME_ID);
        setCanPlay(!playedToday);

        if (playedToday) {
          setNextPlayTime(getNextPlayTime(userData, SUDOKU_GAME_ID));
          setGameMessage("🚫 You have already played Sudoku today!");
        }
        setLoading(false);
      } else {
        router.push("/login");
      }
    };

    initUser();
  }, [authUser, authLoading, router, fetchUserData]);

  /* ---------------- UPDATE TIMER FOR NEXT PLAY ---------------- */
  useEffect(() => {
    if (!canPlay) {
      const interval = setInterval(() => {
        setNextPlayTime(getNextPlayTime(user, SUDOKU_GAME_ID));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  /* ---------------- INITIALIZE GAME ---------------- */
  const initializeGame = useCallback(() => {
    if (!canPlay) return;

    // Generate new Sudoku
    const validBoard = generateValidBoard();
    const { puzzle, solution: sol } = createPuzzle(validBoard);

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
    setMistakes(0);
    setGameStarted(false);
    setGameCompleted(false);
    setHintsUsed(0);
    setEarnedCoins(0);
    setFeedback("");

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [canPlay]);

  useEffect(() => {
    if (canPlay && user) {
      initializeGame();
    }
  }, [canPlay, user, initializeGame]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (gameStarted && !gameCompleted && canPlay) {
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
  }, [gameStarted, gameCompleted, canPlay]);

  /* ---------------- GAME LOGIC ---------------- */
  const handleCellClick = (row: number, col: number) => {
    if (gameCompleted || !canPlay) return;
    if (board[row][col].isOriginal) return;

    if (!gameStarted) setGameStarted(true);
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameCompleted || !canPlay) return;
    if (board[selectedCell.row][selectedCell.col].isOriginal) return;

    const newBoard = [...board];
    const cell = newBoard[selectedCell.row][selectedCell.col];

    // Check if the number is correct
    const isCorrect = solution[selectedCell.row][selectedCell.col] === num;

    cell.value = num;
    cell.isCorrect = isCorrect;

    setBoard(newBoard);

    if (!isCorrect) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setFeedback("❌ Incorrect number!");
      setTimeout(() => setFeedback(""), 1500);

      if (newMistakes >= MAX_MISTAKES) {
        finishGame(false);
      }
    } else {
      setFeedback("✅ Correct!");
      setTimeout(() => setFeedback(""), 1500);

      // Check if puzzle is complete
      const isComplete = newBoard.every(row =>
        row.every(cell => cell.value !== null && cell.isCorrect === true)
      );

      if (isComplete) {
        finishGame(true);
      }
    }
  };

  const useHint = () => {
    if (hintsUsed >= HINT_COUNT || gameCompleted || !canPlay) return;
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
        finishGame(true);
      }
    }
  };

  const clearCell = () => {
    if (!selectedCell || gameCompleted || !canPlay) return;
    if (board[selectedCell.row][selectedCell.col].isOriginal) return;

    const newBoard = [...board];
    const cell = newBoard[selectedCell.row][selectedCell.col];
    cell.value = null;
    cell.isCorrect = null;
    setBoard(newBoard);
  };

  /* ---------------- FINISH GAME ---------------- */
  const calculateCoins = (isWin: boolean): number => {
    if (!isWin) return 10; // Minimum coins for losing

    // Base coins + time bonus + mistakes penalty + hint penalty
    const timeBonus = Math.max(0, Math.floor((300 - time) / 10)); // 5 minutes max
    const mistakesPenalty = mistakes * 5;
    const hintPenalty = hintsUsed * 10;

    return Math.max(10, BASE_COINS + timeBonus - mistakesPenalty - hintPenalty);
  };

  const finishGame = async (isWin: boolean) => {
    setGameCompleted(true);
    const coins = calculateCoins(isWin);
    setEarnedCoins(coins);

    if (!user) {
      console.error("❌ No user found when finishing game");
      return;
    }

    try {
      const token = await getIdToken();
      if (!token) {
        setGameMessage("❌ Failed to save your progress. Please check your connection.");
        return;
      }

      const score = isWin ? Math.max(0, 1000 - Math.floor(time / 10) - (mistakes * 50) - (hintsUsed * 100)) : 0;

      const markPlayedResponse = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: SUDOKU_GAME_ID,
          gameName: SUDOKU_GAME_NAME,
          score: score,
          pointsEarned: coins
        })
      });

      const responseData = await markPlayedResponse.json();

      if (!markPlayedResponse.ok) {
        if (responseData.error?.includes("Game already played") ||
          responseData.error?.includes("once per day")) {
          setGameMessage("🚫 You have already played this game today! Come back tomorrow.");
          setCanPlay(false);
          const tempUser = {
            ...user,
            gamesPlayed: [
              ...(user.gamesPlayed || []),
              {
                gameId: SUDOKU_GAME_ID,
                gameName: SUDOKU_GAME_NAME,
                playedAt: new Date(),
                score: score,
                pointsEarned: coins,
                completed: true
              }
            ]
          };
          setNextPlayTime(getNextPlayTime(tempUser, SUDOKU_GAME_ID));
          return;
        }
        setGameMessage("❌ Failed to save your game progress. Please try again.");
        return;
      }

      if (responseData.success) {
        // Update local state immediately
        const newGameRecord = {
          gameId: SUDOKU_GAME_ID,
          gameName: SUDOKU_GAME_NAME,
          playedAt: new Date(),
          score: score,
          pointsEarned: coins,
          completed: true
        };

        const updatedUser = user ? {
          ...user,
          userPoints: responseData.totalPoints || user.userPoints,
          gamesPlayed: [...(user.gamesPlayed || []), newGameRecord]
        } : null;

        if (updatedUser) {
          setUser(updatedUser);
          setNextPlayTime(getNextPlayTime(updatedUser, SUDOKU_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(isWin
          ? `🎉 Congratulations! You earned ${coins} coins! Come back tomorrow to play again.`
          : `😢 Game Over! You earned ${coins} coins. Try again tomorrow!`
        );
      }

    } catch (error) {
      console.error("❌ Exception during game completion:", error);
      setGameMessage("❌ An error occurred while saving your progress. Please try again.");
    }
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

  // Show "Already Played" screen
  if (!canPlay && !gameStarted) {
    return (
      <div className="sudoku-game-container">
        <div className="sudoku-game-wrapper">
          <header className="sudoku-game-header">
            <div className="sudoku-header-card">
              <div className="sudoku-header-content">
                <div>
                  <h1 className="sudoku-game-title">
                    <CheckSquare className="sudoku-title-icon" />
                    Sudoku Challenge
                  </h1>
                  <p className="sudoku-welcome-message">
                    Welcome, <span className="sudoku-username">{user.name}</span>!
                  </p>
                </div>
                <div className="sudoku-user-coins">
                  <div className="sudoku-coins-display">
                    <Coins className="sudoku-coins-icon" />
                    <span className="sudoku-coins-value">{user.userPoints}</span>
                  </div>
                  <div className="sudoku-coins-label">Total Coins</div>
                </div>
              </div>
            </div>
          </header>

          <div className="sudoku-already-played">
            <div className="sudoku-locked-card">
              <Lock className="sudoku-lock-icon" />
              <h2 className="sudoku-locked-title">Game Already Played Today</h2>
              <p className="sudoku-locked-message">
                {gameMessage || "🚫 You have already played Sudoku today!"}
              </p>
              <div className="sudoku-next-play">
                <div className="sudoku-next-play-label">Next available in:</div>
                <div className="sudoku-next-play-time">{nextPlayTime || "Calculating..."}</div>
              </div>
              <p className="sudoku-locked-hint">
                Come back tomorrow for another challenge!
              </p>
              <button
                onClick={() => router.push("/zone")}
                className="sudoku-button sudoku-button-primary"
              >
                <Gamepad2 className="sudoku-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        </div>
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
                  <CheckSquare className="sudoku-title-icon" />
                  Sudoku Challenge
                </h1>
                <p className="sudoku-welcome-message">
                  Welcome, <span className="sudoku-username">{user.name}</span>! Fill the grid correctly to earn coins.
                </p>
              </div>
              <div className="sudoku-user-coins">
                <div className="sudoku-coins-display">
                  <Coins className="sudoku-coins-icon" />
                  <span className="sudoku-coins-value">{user.userPoints}</span>
                </div>
                <div className="sudoku-coins-label">Total Coins</div>
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

            <div className="sudoku-stat-card sudoku-stat-mistakes">
              <div className="sudoku-stat-header">
                <XSquare className="sudoku-stat-icon" />
                <span className="sudoku-stat-label">Mistakes</span>
              </div>
              <div className="sudoku-stat-value">{mistakes}/{MAX_MISTAKES}</div>
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
              <div className="sudoku-stat-value">Medium</div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`sudoku-feedback-message ${feedback.includes("✅") ? "success" :
              feedback.includes("❌") ? "error" :
                "hint"
              }`}>
              {feedback}
            </div>
          )}

          {/* Game Message */}
          {gameMessage && (
            <div className="sudoku-game-message">
              <div className={`sudoku-message-card ${gameMessage.includes("🎉") ? 'success' : gameMessage.includes("🚫") ? 'error' : 'info'}`}>
                {gameMessage}
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="sudoku-controls-container">
          <div className="sudoku-controls-group">
            <button
              onClick={initializeGame}
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
              {notesMode ? 'Notes Mode ON' : 'Notes Mode OFF'}
            </button>

            <button
              onClick={clearCell}
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
                <li>You have {MAX_MISTAKES} mistakes allowed</li>
                <li>Use hints to reveal correct numbers</li>
              </ul>
            </div>

            {/* Game Info */}
            <div className="sudoku-game-info">
              <h3 className="sudoku-side-title">Game Info</h3>
              <div className="sudoku-info-grid">
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Difficulty</span>
                  <span className="sudoku-info-value">Medium</span>
                </div>
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Max Mistakes</span>
                  <span className="sudoku-info-value">{MAX_MISTAKES}</span>
                </div>
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Hints Available</span>
                  <span className="sudoku-info-value">{HINT_COUNT}</span>
                </div>
                <div className="sudoku-info-item">
                  <span className="sudoku-info-label">Coins Reward</span>
                  <span className="sudoku-info-value">{BASE_COINS}+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Completed Overlay */}
        {gameCompleted && (
          <div className="sudoku-completion-overlay">
            <div className="sudoku-completion-card">
              <div className="sudoku-completion-emoji">
                {mistakes < MAX_MISTAKES ? "🎉" : "😢"}
              </div>
              <h3 className="sudoku-completion-title">
                {mistakes < MAX_MISTAKES ? "Puzzle Complete!" : "Game Over!"}
              </h3>
              <p className="sudoku-completion-text">
                Time: {formatTime(time)} • Mistakes: {mistakes}
              </p>
              <div className="sudoku-coins-earned">
                +{earnedCoins} coins earned!
              </div>
              <div className="sudoku-total-coins">
                Total coins: <span className="sudoku-total-coins-value">{user.userPoints}</span>
              </div>

              {gameMessage && (
                <div className="sudoku-game-status">
                  <p>{gameMessage}</p>
                </div>
              )}

              <div className="sudoku-next-play-info">
                <p>Come back tomorrow for a new puzzle!</p>
                <p className="sudoku-next-play-hint">Next play available: {nextPlayTime || "Calculating..."}</p>
              </div>
              <button
                onClick={() => router.push("/zone")}
                className="sudoku-button sudoku-button-primary"
              >
                <Gamepad2 className="sudoku-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}