"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Timer, RefreshCw, Trophy, HelpCircle,
  Zap, Lock, Coins, AlertCircle, Gamepad2,
  Check, X, Grid, BookOpen, Lightbulb
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./crossword-game.css";

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

interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
  solved: boolean;
}

interface CrosswordCell {
  row: number;
  col: number;
  value: string;
  isBlack: boolean;
  isSelected: boolean;
  isCorrect: boolean | null;
  number: number | null;
}

const CROSSWORD_GAME_ID = "crossword";
const CROSSWORD_GAME_NAME = "Game Crossword";
const BASE_COINS = 5;
const HINT_COUNT = 3;

/* ---------------- CROSSWORD PUZZLES ---------------- */
interface PuzzleData {
  id: number;
  title: string;
  clues: Omit<CrosswordClue, 'solved'>[];
}

const CROSSWORD_PUZZLES: PuzzleData[] = [
  {
    id: 1,
    title: "Game Terms Crossword",
    clues: [
      // Across clues
      { number: 1, direction: 'across', clue: "Winning move in chess", answer: "CHECKMATE", row: 0, col: 0, length: 9 },
      { number: 4, direction: 'across', clue: "Video game controller button", answer: "START", row: 2, col: 0, length: 5 },
      { number: 6, direction: 'across', clue: "Game character's representation", answer: "AVATAR", row: 4, col: 0, length: 6 },
      { number: 8, direction: 'across', clue: "Points earned in games", answer: "SCORE", row: 6, col: 0, length: 5 },
      { number: 9, direction: 'across', clue: "Underground area in RPGs", answer: "DUNGEON", row: 7, col: 0, length: 7 },

      // Down clues
      { number: 2, direction: 'down', clue: "Card game wild card", answer: "JOKER", row: 0, col: 2, length: 5 },
      { number: 3, direction: 'down', clue: "Strategy game resource", answer: "GOLD", row: 0, col: 4, length: 4 },
      { number: 5, direction: 'down', clue: "Game level or phase", answer: "STAGE", row: 2, col: 6, length: 5 },
      { number: 7, direction: 'down', clue: "Mission in RPGs", answer: "QUEST", row: 4, col: 8, length: 5 },
    ]
  },
  {
    id: 2,
    title: "Gaming Platform Crossword",
    clues: [
      // Across clues
      { number: 1, direction: 'across', clue: "Nintendo's famous plumber", answer: "MARIO", row: 0, col: 0, length: 5 },
      { number: 4, direction: 'across', clue: "Xbox console model", answer: "SERIESX", row: 2, col: 0, length: 7 },
      { number: 6, direction: 'across', clue: "PlayStation controller feature", answer: "VIBRATION", row: 4, col: 0, length: 9 },
      { number: 8, direction: 'across', clue: "Nintendo's handheld device", answer: "SWITCH", row: 6, col: 0, length: 6 },

      // Down clues
      { number: 2, direction: 'down', clue: "Sony's gaming console", answer: "PLAYSTATION", row: 0, col: 2, length: 11 },
      { number: 3, direction: 'down', clue: "Microsoft's gaming service", answer: "GAMEPASS", row: 0, col: 4, length: 8 },
      { number: 5, direction: 'down', clue: "Steam's parent company", answer: "VALVE", row: 2, col: 6, length: 5 },
      { number: 7, direction: 'down', clue: "Online gaming platform", answer: "STEAM", row: 4, col: 8, length: 5 },
    ]
  }
];

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

/* ---------------- CREATE CROSSWORD GRID ---------------- */
const createCrosswordGrid = (clues: Omit<CrosswordClue, 'solved'>[]): { grid: CrosswordCell[][], clues: CrosswordClue[] } => {
  const grid: CrosswordCell[][] = [];
  const gridSize = 12;

  // Initialize empty grid
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      grid[row][col] = {
        row,
        col,
        value: '',
        isBlack: true,
        isSelected: false,
        isCorrect: null,
        number: null
      };
    }
  }

  // Place clues on grid
  const placedClues = clues.map(clue => ({
    ...clue,
    solved: false
  }));

  placedClues.forEach(clue => {
    const { row, col, length, direction, number } = clue;

    // Place letters
    for (let i = 0; i < length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;

      if (currentRow < gridSize && currentCol < gridSize) {
        grid[currentRow][currentCol].isBlack = false;

        // Add clue number
        if (i === 0) {
          grid[currentRow][currentCol].number = number;
        }
      }
    }
  });

  return { grid, clues: placedClues };
};

/* ---------------- COMPONENT ---------------- */

export default function CrosswordGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [clues, setClues] = useState<CrosswordClue[]>([]);
  const [selectedClue, setSelectedClue] = useState<CrosswordClue | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [time, setTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [inputValue, setInputValue] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        const playedToday = hasPlayedToday(userData, CROSSWORD_GAME_ID);
        setCanPlay(!playedToday);

        if (playedToday) {
          setNextPlayTime(getNextPlayTime(userData, CROSSWORD_GAME_ID));
          setGameMessage("🚫 You have already played Crossword today!");
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
        setNextPlayTime(getNextPlayTime(user, CROSSWORD_GAME_ID));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  /* ---------------- INITIALIZE GAME ---------------- */
  const initializeGame = useCallback(() => {
    if (!canPlay) return;

    // Select random puzzle
    const puzzle = CROSSWORD_PUZZLES[Math.floor(Math.random() * CROSSWORD_PUZZLES.length)];
    const { grid: newGrid, clues: newClues } = createCrosswordGrid(puzzle.clues);

    setGrid(newGrid);
    setClues(newClues);
    setSelectedClue(null);
    setSelectedCell(null);
    setTime(0);
    setHintsUsed(0);
    setGameStarted(false);
    setGameCompleted(false);
    setEarnedCoins(0);
    setFeedback("");
    setInputValue("");

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
    if (gameCompleted || !canPlay || grid[row][col].isBlack) return;

    if (!gameStarted) setGameStarted(true);

    // Update selected cell
    const newGrid = [...grid];
    newGrid.forEach(r => r.forEach(c => { c.isSelected = false; }));
    newGrid[row][col].isSelected = true;
    setGrid(newGrid);
    setSelectedCell({ row, col });

    // Find clue for this cell
    const clue = clues.find(c =>
      (c.direction === 'across' && c.row === row && col >= c.col && col < c.col + c.length) ||
      (c.direction === 'down' && c.col === col && row >= c.row && row < c.row + c.length)
    );

    if (clue) {
      setSelectedClue(clue);
    }

    // Focus input
    inputRef.current?.focus();
  };

  const handleClueClick = (clue: CrosswordClue) => {
    if (gameCompleted || !canPlay) return;

    if (!gameStarted) setGameStarted(true);

    setSelectedClue(clue);

    // Select first cell of the clue
    const newGrid = [...grid];
    newGrid.forEach(r => r.forEach(c => { c.isSelected = false; }));
    newGrid[clue.row][clue.col].isSelected = true;
    setGrid(newGrid);
    setSelectedCell({ row: clue.row, col: clue.col });

    // Focus input
    inputRef.current?.focus();
  };

  const handleInput = (letter: string) => {
    if (!selectedCell || gameCompleted || !canPlay || !selectedClue) return;

    const newGrid = [...grid];
    const cell = newGrid[selectedCell.row][selectedCell.col];

    // Only allow letters
    if (!/^[A-Z]$/i.test(letter)) return;

    cell.value = letter.toUpperCase();

    // Move to next cell in clue direction
    let nextCell = null;
    if (selectedClue.direction === 'across') {
      if (selectedCell.col < selectedClue.col + selectedClue.length - 1) {
        nextCell = { row: selectedCell.row, col: selectedCell.col + 1 };
      }
    } else {
      if (selectedCell.row < selectedClue.row + selectedClue.length - 1) {
        nextCell = { row: selectedCell.row + 1, col: selectedCell.col };
      }
    }

    if (nextCell && !newGrid[nextCell.row][nextCell.col].isBlack) {
      newGrid.forEach(r => r.forEach(c => { c.isSelected = false; }));
      newGrid[nextCell.row][nextCell.col].isSelected = true;
      setSelectedCell(nextCell);
    }

    setGrid(newGrid);
    setInputValue("");

    // Check if clue is complete
    checkClueCompletion(selectedClue, newGrid);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameCompleted || !canPlay || !selectedCell) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      const newGrid = [...grid];
      const cell = newGrid[selectedCell.row][selectedCell.col];
      cell.value = '';
      setGrid(newGrid);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(e.key);
    } else if (e.key.length === 1 && /^[A-Za-z]$/.test(e.key)) {
      handleInput(e.key.toUpperCase());
    }
  };

  const moveSelection = (direction: string) => {
    if (!selectedCell) return;

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (direction) {
      case 'ArrowLeft': newCol--; break;
      case 'ArrowRight': newCol++; break;
      case 'ArrowUp': newRow--; break;
      case 'ArrowDown': newRow++; break;
    }

    // Find nearest non-black cell in that direction
    while (
      newRow >= 0 && newRow < grid.length &&
      newCol >= 0 && newCol < grid[0].length &&
      grid[newRow][newCol].isBlack
    ) {
      switch (direction) {
        case 'ArrowLeft': newCol--; break;
        case 'ArrowRight': newCol++; break;
        case 'ArrowUp': newRow--; break;
        case 'ArrowDown': newRow++; break;
      }
    }

    if (newRow >= 0 && newRow < grid.length &&
      newCol >= 0 && newCol < grid[0].length &&
      !grid[newRow][newCol].isBlack) {
      handleCellClick(newRow, newCol);
    }
  };

  const checkClueCompletion = (clue: CrosswordClue, currentGrid: CrosswordCell[][]) => {
    let isComplete = true;
    let isCorrect = true;

    for (let i = 0; i < clue.answer.length; i++) {
      const row = clue.direction === 'across' ? clue.row : clue.row + i;
      const col = clue.direction === 'across' ? clue.col + i : clue.col;

      const cell = currentGrid[row][col];
      const expectedLetter = clue.answer[i];

      if (!cell.value) {
        isComplete = false;
        break;
      }

      if (cell.value !== expectedLetter) {
        isCorrect = false;
      }
    }

    if (isComplete) {
      const newClues = [...clues];
      const clueIndex = newClues.findIndex(c =>
        c.number === clue.number && c.direction === clue.direction
      );

      if (clueIndex !== -1) {
        newClues[clueIndex].solved = isCorrect;
        setClues(newClues);

        if (isCorrect) {
          setFeedback(`✅ Correct! "${clue.answer}" is right!`);
          setTimeout(() => setFeedback(""), 2000);

          // Check if all clues are solved
          const allSolved = newClues.every(c => c.solved);
          if (allSolved) {
            finishGame(true);
          }
        } else {
          setFeedback("❌ Some letters are incorrect. Keep trying!");
          setTimeout(() => setFeedback(""), 2000);
        }
      }
    }
  };

  const useHint = () => {
    if (hintsUsed >= HINT_COUNT || gameCompleted || !canPlay || !selectedClue) return;

    const newGrid = [...grid];
    const newClues = [...clues];
    const clueIndex = newClues.findIndex(c =>
      c.number === selectedClue.number && c.direction === selectedClue.direction
    );

    if (clueIndex !== -1 && !newClues[clueIndex].solved) {
      // Reveal one random letter from the clue
      const unrevealedPositions = [];
      for (let i = 0; i < selectedClue.answer.length; i++) {
        const row = selectedClue.direction === 'across' ? selectedClue.row : selectedClue.row + i;
        const col = selectedClue.direction === 'across' ? selectedClue.col + i : selectedClue.col;

        if (!newGrid[row][col].value) {
          unrevealedPositions.push({ row, col, letter: selectedClue.answer[i] });
        }
      }

      if (unrevealedPositions.length > 0) {
        const randomPos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
        newGrid[randomPos.row][randomPos.col].value = randomPos.letter;
        newGrid[randomPos.row][randomPos.col].isCorrect = true;

        setGrid(newGrid);
        setHintsUsed(prev => prev + 1);
        setFeedback(`💡 Revealed letter "${randomPos.letter}"!`);
        setTimeout(() => setFeedback(""), 2000);

        // Check if clue is now complete
        checkClueCompletion(selectedClue, newGrid);
      }
    }
  };

  const solvePuzzle = () => {
    if (gameCompleted || !canPlay) return;
    finishGame(false);
  };

  /* ---------------- FINISH GAME ---------------- */
  const calculateCoins = (isWin: boolean): number => {
    if (!isWin) return 15;

    // Base coins + time bonus + hint penalty + solved clues bonus
    const solvedClues = clues.filter(c => c.solved).length;
    const totalClues = clues.length;
    const cluesBonus = Math.floor((solvedClues / totalClues) * 30);
    const timeBonus = Math.max(0, Math.floor((600 - time) / 20)); // 10 minutes max
    const hintPenalty = hintsUsed * 15;

    return Math.max(10, BASE_COINS + cluesBonus + timeBonus - hintPenalty);
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

      const solvedClues = clues.filter(c => c.solved).length;
      const totalClues = clues.length;
      const score = isWin ? 1000 : Math.floor((solvedClues / totalClues) * 750);

      const markPlayedResponse = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: CROSSWORD_GAME_ID,
          gameName: CROSSWORD_GAME_NAME,
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
                gameId: CROSSWORD_GAME_ID,
                gameName: CROSSWORD_GAME_NAME,
                playedAt: new Date(),
                score: score,
                pointsEarned: coins,
                completed: true
              }
            ]
          };
          setNextPlayTime(getNextPlayTime(tempUser, CROSSWORD_GAME_ID));
          return;
        }
        setGameMessage("❌ Failed to save your game progress. Please try again.");
        return;
      }

      if (responseData.success) {
        // Update local state immediately
        const newGameRecord = {
          gameId: CROSSWORD_GAME_ID,
          gameName: CROSSWORD_GAME_NAME,
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
          setNextPlayTime(getNextPlayTime(updatedUser, CROSSWORD_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(isWin
          ? `🎉 Congratulations! You solved all clues! Earned ${coins} coins.`
          : `You solved ${solvedClues}/${totalClues} clues. Earned ${coins} coins. Try again tomorrow!`
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
      <div className="crossword-loading-screen">
        <div className="crossword-loading-message">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crossword-loading-screen">
        <div className="crossword-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="crossword-loading-screen">
        <div className="crossword-loading-message">Redirecting to login...</div>
      </div>
    );
  }

  // Show "Already Played" screen
  if (!canPlay && !gameStarted) {
    return (
      <div className="crossword-game-container">
        <div className="crossword-game-wrapper">
          <header className="crossword-game-header">
            <div className="crossword-header-card">
              <div className="crossword-header-content">
                <div>
                  <h1 className="crossword-game-title">
                    <Grid className="crossword-title-icon" />
                    Game Crossword
                  </h1>
                  <p className="crossword-welcome-message">
                    Welcome, <span className="crossword-username">{user.name}</span>!
                  </p>
                </div>
                <div className="crossword-user-coins">
                  <div className="crossword-coins-display">
                    <Coins className="crossword-coins-icon" />
                    <span className="crossword-coins-value">{user.userPoints}</span>
                  </div>
                  <div className="crossword-coins-label">Total Coins</div>
                </div>
              </div>
            </div>
          </header>

          <div className="crossword-already-played">
            <div className="crossword-locked-card">
              <Lock className="crossword-lock-icon" />
              <h2 className="crossword-locked-title">Game Already Played Today</h2>
              <p className="crossword-locked-message">
                {gameMessage || "🚫 You have already played Crossword today!"}
              </p>
              <div className="crossword-next-play">
                <div className="crossword-next-play-label">Next available in:</div>
                <div className="crossword-next-play-time">{nextPlayTime || "Calculating..."}</div>
              </div>
              <p className="crossword-locked-hint">
                Come back tomorrow for a new crossword puzzle!
              </p>
              <button
                onClick={() => router.push("/zone")}
                className="crossword-button crossword-button-primary"
              >
                <Gamepad2 className="crossword-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (grid.length === 0) {
    return (
      <div className="crossword-loading-screen">
        <div className="crossword-loading-message">Generating crossword...</div>
      </div>
    );
  }

  return (
    <div className="crossword-game-container">
      <div className="crossword-game-wrapper">
        {/* Header */}
        <header className="crossword-game-header">
          <div className="crossword-header-card">
            <div className="crossword-header-content">
              <div>
                <h1 className="crossword-game-title">
                  <Grid className="crossword-title-icon" />
                  Game Crossword
                </h1>
                <p className="crossword-welcome-message">
                  Welcome, <span className="crossword-username">{user.name}</span>! Solve the crossword puzzle.
                </p>
              </div>
              <div className="crossword-user-coins">
                <div className="crossword-coins-display">
                  <Coins className="crossword-coins-icon" />
                  <span className="crossword-coins-value">{user.userPoints}</span>
                </div>
                <div className="crossword-coins-label">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        {/* Game Stats */}
        <div className="crossword-stats-container">
          <div className="crossword-stats-grid">
            <div className="crossword-stat-card crossword-stat-time">
              <div className="crossword-stat-header">
                <Timer className="crossword-stat-icon" />
                <span className="crossword-stat-label">Time</span>
              </div>
              <div className="crossword-stat-value">{formatTime(time)}</div>
            </div>

            <div className="crossword-stat-card crossword-stat-clues">
              <div className="crossword-stat-header">
                <BookOpen className="crossword-stat-icon" />
                <span className="crossword-stat-label">Clues Solved</span>
              </div>
              <div className="crossword-stat-value">
                {clues.filter(c => c.solved).length}/{clues.length}
              </div>
            </div>

            <div className="crossword-stat-card crossword-stat-hints">
              <div className="crossword-stat-header">
                <HelpCircle className="crossword-stat-icon" />
                <span className="crossword-stat-label">Hints</span>
              </div>
              <div className="crossword-stat-value">{HINT_COUNT - hintsUsed}</div>
            </div>

            <div className="crossword-stat-card crossword-stat-difficulty">
              <div className="crossword-stat-header">
                <Trophy className="crossword-stat-icon" />
                <span className="crossword-stat-label">Difficulty</span>
              </div>
              <div className="crossword-stat-value">Medium</div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`crossword-feedback-message ${feedback.includes("✅") ? "success" :
              feedback.includes("❌") ? "error" :
                "hint"
              }`}>
              {feedback}
            </div>
          )}

          {/* Game Message */}
          {gameMessage && (
            <div className="crossword-game-message">
              <div className={`crossword-message-card ${gameMessage.includes("🎉") ? 'success' : gameMessage.includes("🚫") ? 'error' : 'info'}`}>
                {gameMessage}
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="crossword-controls-container">
          <div className="crossword-controls-group">
            <button
              onClick={initializeGame}
              className="crossword-button crossword-button-restart"
            >
              <RefreshCw className="crossword-button-icon" />
              New Puzzle
            </button>

            <button
              onClick={useHint}
              disabled={hintsUsed >= HINT_COUNT || gameCompleted || !selectedClue}
              className="crossword-button crossword-button-hint"
            >
              <HelpCircle className="crossword-button-icon" />
              Use Hint ({HINT_COUNT - hintsUsed} left)
            </button>

            <button
              onClick={solvePuzzle}
              disabled={gameCompleted}
              className="crossword-button crossword-button-secondary"
            >
              <Lightbulb className="crossword-button-icon" />
              Solve Puzzle
            </button>

            <div className="crossword-input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                disabled={gameCompleted || !selectedCell}
                className="crossword-input"
                placeholder="Type letter or use arrow keys..."
                maxLength={1}
              />
              <div className="crossword-input-hint">
                Click a cell and type letters
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="crossword-game-area">
          {/* Crossword Grid */}
          <div className="crossword-board-section">
            <div className="crossword-board-card">
              <h3 className="crossword-board-title">Crossword Grid</h3>
              <div className="crossword-board">
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="crossword-row">
                    {row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        disabled={cell.isBlack}
                        className={`crossword-cell ${cell.isBlack ? 'crossword-cell-black' : ''
                          } ${cell.isSelected ? 'crossword-cell-selected' : ''
                          } ${cell.isCorrect === true ? 'crossword-cell-correct' : ''
                          } ${cell.isCorrect === false ? 'crossword-cell-wrong' : ''
                          }`}
                      >
                        {cell.number && (
                          <div className="crossword-cell-number">{cell.number}</div>
                        )}
                        {cell.value && (
                          <div className="crossword-cell-letter">{cell.value}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clues Panel */}
          <div className="crossword-clues-section">
            <div className="crossword-clues-card">
              {/* Selected Clue */}
              {selectedClue && (
                <div className="crossword-selected-clue">
                  <h3 className="crossword-side-title">
                    <Lightbulb className="crossword-side-icon" />
                    Current Clue
                  </h3>
                  <div className="crossword-clue-details">
                    <div className="crossword-clue-header">
                      <span className="crossword-clue-number">{selectedClue.number}</span>
                      <span className="crossword-clue-direction">
                        {selectedClue.direction.toUpperCase()}
                      </span>
                    </div>
                    <p className="crossword-clue-text">{selectedClue.clue}</p>
                    <div className="crossword-clue-answer">
                      <span className="crossword-clue-answer-label">Answer: </span>
                      <span className="crossword-clue-answer-value">
                        {selectedClue.solved
                          ? selectedClue.answer
                          : "?".repeat(selectedClue.answer.length)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* All Clues */}
              <div className="crossword-all-clues">
                <div className="crossword-clues-column">
                  <h3 className="crossword-side-title">
                    <BookOpen className="crossword-side-icon" />
                    Across
                  </h3>
                  <div className="crossword-clues-list">
                    {clues
                      .filter(clue => clue.direction === 'across')
                      .sort((a, b) => a.number - b.number)
                      .map(clue => (
                        <button
                          key={`${clue.number}-across`}
                          onClick={() => handleClueClick(clue)}
                          className={`crossword-clue-item ${clue.solved ? 'crossword-clue-solved' : ''
                            } ${selectedClue?.number === clue.number &&
                              selectedClue?.direction === clue.direction
                              ? 'crossword-clue-selected' : ''
                            }`}
                        >
                          <span className="crossword-clue-item-number">{clue.number}.</span>
                          <span className="crossword-clue-item-text">{clue.clue}</span>
                          {clue.solved && <Check className="crossword-clue-check" size={14} />}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="crossword-clues-column">
                  <h3 className="crossword-side-title">
                    <BookOpen className="crossword-side-icon" />
                    Down
                  </h3>
                  <div className="crossword-clues-list">
                    {clues
                      .filter(clue => clue.direction === 'down')
                      .sort((a, b) => a.number - b.number)
                      .map(clue => (
                        <button
                          key={`${clue.number}-down`}
                          onClick={() => handleClueClick(clue)}
                          className={`crossword-clue-item ${clue.solved ? 'crossword-clue-solved' : ''
                            } ${selectedClue?.number === clue.number &&
                              selectedClue?.direction === clue.direction
                              ? 'crossword-clue-selected' : ''
                            }`}
                        >
                          <span className="crossword-clue-item-number">{clue.number}.</span>
                          <span className="crossword-clue-item-text">{clue.clue}</span>
                          {clue.solved && <Check className="crossword-clue-check" size={14} />}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="crossword-instructions">
                <h3 className="crossword-side-title">How to Play</h3>
                <ul className="crossword-instructions-list">
                  <li>Click a clue or grid cell to select it</li>
                  <li>Type letters to fill the grid</li>
                  <li>Use arrow keys to move between cells</li>
                  <li>Press Backspace to clear a cell</li>
                  <li>Complete all clues to win!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Game Completed Overlay */}
        {gameCompleted && (
          <div className="crossword-completion-overlay">
            <div className="crossword-completion-card">
              <div className="crossword-completion-emoji">
                {clues.every(c => c.solved) ? "🎉" : "📝"}
              </div>
              <h3 className="crossword-completion-title">
                {clues.every(c => c.solved) ? "Puzzle Complete!" : "Game Finished!"}
              </h3>
              <p className="crossword-completion-text">
                Solved {clues.filter(c => c.solved).length}/{clues.length} clues in {formatTime(time)}
              </p>
              <div className="crossword-coins-earned">
                +{earnedCoins} coins earned!
              </div>
              <div className="crossword-total-coins">
                Total coins: <span className="crossword-total-coins-value">{user.userPoints}</span>
              </div>

              {gameMessage && (
                <div className="crossword-game-status">
                  <p>{gameMessage}</p>
                </div>
              )}

              <div className="crossword-next-play-info">
                <p>Come back tomorrow for a new crossword!</p>
                <p className="crossword-next-play-hint">Next play available: {nextPlayTime || "Calculating..."}</p>
              </div>
              <button
                onClick={() => router.push("/zone")}
                className="crossword-button crossword-button-primary"
              >
                <Gamepad2 className="crossword-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}