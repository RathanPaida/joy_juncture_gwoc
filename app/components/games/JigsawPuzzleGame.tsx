"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Timer,
  Trophy,
  Eye,
  EyeOff,
  HelpCircle,
  Puzzle,
  Zap,
  Move,
  Check,
  X as XIcon,
  Coins,
  Grid,
  AlertCircle,
  Gamepad2
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./jigsaw-puzzle-game.css";

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

interface Game {
  id: string;
  name: string;
  imageUrl: string;
  category: string[];
  players: string;
  duration: string;
}

interface PuzzlePiece {
  /** fixed index 0..TOTAL_PIECES-1, used for sprite math */
  index: number;
  isPlaced: boolean;
  isCorrect: boolean;
}

const JIGSAW_GAME_ID = "jigsaw-puzzle";
const JIGSAW_GAME_NAME = "Jigsaw Puzzle Challenge";
const ROWS = 4;
const COLS = 4;
const TOTAL_PIECES = ROWS * COLS;
const HINT_COUNT = 2;
const BASE_COINS = 10;
const TIME_LIMIT = 420;

export default function JigsawPuzzleGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [gridState, setGridState] = useState<(PuzzlePiece | null)[][]>([]);
  const [placedPieces, setPlacedPieces] = useState(0);
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const gridRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gamesFetched = useRef(false);

  const hasPlayedToday = (u: User | null, gameId: string): boolean => {
    if (!u || !u.gamesPlayed) return false;
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return u.gamesPlayed.some((game) => {
      if (game.gameId !== gameId) return false;
      const playedDate = new Date(game.playedAt);
      const playedUTC = new Date(
        Date.UTC(
          playedDate.getUTCFullYear(),
          playedDate.getUTCMonth(),
          playedDate.getUTCDate()
        )
      );
      return playedUTC.getTime() === todayUTC.getTime();
    });
  };

  const getNextPlayTime = (u: User | null, gameId: string): string => {
    if (!u || !u.gamesPlayed) return "Play Now";
    const gameRecords = u.gamesPlayed
      .filter((g) => g.gameId === gameId)
      .sort(
        (a, b) =>
          new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
      );
    if (gameRecords.length === 0) return "Play Now";

    const lastPlayed = new Date(gameRecords[0].playedAt);
    const playedUTC = new Date(
      Date.UTC(
        lastPlayed.getUTCFullYear(),
        lastPlayed.getUTCMonth(),
        lastPlayed.getUTCDate()
      )
    );
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
      )
    );

    if (playedUTC.getTime() >= todayUTC.getTime()) {
      const tomorrowUTC = new Date(playedUTC);
      tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
      const nowUTC = new Date();
      const diff = tomorrowUTC.getTime() - nowUTC.getTime();
      if (diff <= 0) return "Play Now";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      );
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return "Play Now";
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken();
    } catch (e) {
      console.error("Error getting ID token:", e);
      return null;
    }
  };

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
    } catch (e) {
      console.error("Error fetching user:", e);
      return null;
    }
  }, []);

  const fetchGames = useCallback(async () => {
    if (gamesFetched.current) return;
    try {
      const response = await fetch("/api/game-images");
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const formattedGames: Game[] = data.data.map((g: any) => ({
          id: g._id?.toString() || Math.random().toString(36).slice(2),
          name: g.name || "Unnamed Image",
          imageUrl:
            g.imageUrl ||
            "https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=600&h=400&fit=crop",
          category: [g.category || "general"],
          players: "1",
          duration: "5-15 min"
        }));
        setGames(formattedGames);
        gamesFetched.current = true;
        if (formattedGames.length > 0) {
          const randomGame =
            formattedGames[
              Math.floor(Math.random() * formattedGames.length)
            ];
          setCurrentGame(randomGame);
        }
      }
    } catch (e) {
      console.error("Error fetching game images:", e);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }
    const init = async () => {
      const userData = await fetchUserData();
      if (!userData) {
        router.push("/login");
        return;
      }
      setUser(userData);
      const playedToday = hasPlayedToday(userData, JIGSAW_GAME_ID);
      setCanPlay(!playedToday);
      if (playedToday) {
        const nextTime = getNextPlayTime(userData, JIGSAW_GAME_ID);
        setNextPlayTime(nextTime);
        setGameMessage("🚫 You have already played Jigsaw Puzzle today!");
      }
      if (!gamesFetched.current && !playedToday) {
        fetchGames();
      }
      setLoading(false);
    };
    init();
  }, [authUser, authLoading, router, fetchUserData, fetchGames]);

  useEffect(() => {
    if (!canPlay) {
      const interval = setInterval(() => {
        setNextPlayTime(getNextPlayTime(user, JIGSAW_GAME_ID));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  /** fixed sprite math helpers */

  const getRowFromIndex = (index: number) => Math.floor(index / COLS);
  const getColFromIndex = (index: number) => index % COLS;

  const getPieceBackgroundPosition = (index: number): string => {
    const row = getRowFromIndex(index);
    const col = getColFromIndex(index);
    const xPercent = (col * 100) / (COLS - 1);
    const yPercent = (row * 100) / (ROWS - 1);
    return `${xPercent}% ${yPercent}%`;
  };

  const getPieceBackgroundSize = (): string =>
    `${COLS * 100}% ${ROWS * 100}%`;

  const shufflePieces = (indices: number[]): PuzzlePiece[] => {
    const arr = indices.map((i) => ({
      index: i,
      isPlaced: false,
      isCorrect: false
    }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const initializeGame = useCallback(() => {
    if (!currentGame || !canPlay) return;

    const initialGrid: (PuzzlePiece | null)[][] = Array.from(
      { length: ROWS },
      () => Array.from({ length: COLS }, () => null)
    );

    const indices = Array.from({ length: TOTAL_PIECES }, (_, i) => i);
    const shuffledPieces = shufflePieces(indices);

    setPuzzlePieces(shuffledPieces);
    setGridState(initialGrid);
    setPlacedPieces(0);
    setTime(0);
    setMoves(0);
    setGameStarted(false);
    setGameCompleted(false);
    setHintsUsed(0);
    setSelectedPiece(null);
    setFeedbackMessage("");
    setEarnedCoins(0);

    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentGame, canPlay]);

  useEffect(() => {
    if (currentGame && canPlay && puzzlePieces.length === 0) {
      initializeGame();
    }
  }, [currentGame, canPlay, puzzlePieces.length, initializeGame]);

  useEffect(() => {
    if (gameStarted && !gameCompleted && canPlay) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameCompleted, canPlay]);

  const handlePieceSelect = (piece: PuzzlePiece) => {
    if (piece.isPlaced || gameCompleted || !canPlay) return;
    setSelectedPiece(piece);
    if (!gameStarted) setGameStarted(true);
  };

  const handleGridCellClick = (row: number, col: number) => {
    if (!selectedPiece || gameCompleted || !canPlay) return;
    if (gridState[row][col]) {
      setFeedbackMessage("This position is already taken!");
      setTimeout(() => setFeedbackMessage(""), 2000);
      return;
    }

    const correctRow = getRowFromIndex(selectedPiece.index);
    const correctCol = getColFromIndex(selectedPiece.index);
    const isCorrect = correctRow === row && correctCol === col;

    const newGrid = gridState.map((r) => r.slice());
    newGrid[row][col] = {
      ...selectedPiece,
      isPlaced: true,
      isCorrect
    };
    setGridState(newGrid);

    setPuzzlePieces((prev) =>
      prev.map((p) =>
        p.index === selectedPiece.index
          ? { ...p, isPlaced: true, isCorrect }
          : p
      )
    );

    setMoves((prev) => prev + 1);

    if (isCorrect) {
      setPlacedPieces((prev) => prev + 1);
      setFeedbackMessage("✅ Correct placement!");
      setTimeout(() => setFeedbackMessage(""), 1500);
    } else {
      setFeedbackMessage("❌ Wrong position! Try again.");
      setTimeout(() => setFeedbackMessage(""), 1500);

      setTimeout(() => {
        setGridState((prev) => {
          const updated = prev.map((r) => r.slice());
          if (updated[row][col]?.index === selectedPiece.index) {
            updated[row][col] = null;
          }
          return updated;
        });
        setPuzzlePieces((prev) =>
          prev.map((p) =>
            p.index === selectedPiece.index
              ? { ...p, isPlaced: false, isCorrect: false }
              : p
          )
        );
      }, 1500);
    }

    setSelectedPiece(null);
  };

  const useHint = () => {
    if (hintsUsed >= HINT_COUNT || gameCompleted || !canPlay) return;
    const unplaced = puzzlePieces.find((p) => !p.isPlaced);
    if (!unplaced) return;
    setSelectedPiece(unplaced);
    setHintsUsed((prev) => prev + 1);

    const r = getRowFromIndex(unplaced.index);
    const c = getColFromIndex(unplaced.index);
    setFeedbackMessage(
      `💡 Hint: Piece ${unplaced.index + 1} belongs at row ${r + 1}, column ${
        c + 1
      }`
    );
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const calculateCoins = () => {
    const timeBonus = Math.max(0, Math.floor((TIME_LIMIT - time) / 10));
    const optimalMoves = TOTAL_PIECES;
    const movesPenalty = Math.max(0, (moves - optimalMoves) * 2);
    const hintPenalty = hintsUsed * 10;
    return Math.max(10, BASE_COINS + timeBonus - movesPenalty - hintPenalty);
  };

  const finishGame = useCallback(async () => {
    setGameCompleted(true);
    const coins = calculateCoins();
    setEarnedCoins(coins);

    if (!user) {
      console.error("No user when finishing game");
      return;
    }

    try {
      const token = await getIdToken();
      if (!token) {
        setGameMessage(
          "❌ Failed to save your progress. Please check your connection."
        );
        return;
      }

      const score = Math.max(
        0,
        1000 - Math.floor(time / 10) - moves * 2 - hintsUsed * 100
      );

      const res = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: JIGSAW_GAME_ID,
          gameName: JIGSAW_GAME_NAME,
          score,
          pointsEarned: coins
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (
          data.error?.includes("Game already played") ||
          data.error?.includes("once per day")
        ) {
          setGameMessage(
            "🚫 You have already played this game today! Come back tomorrow."
          );
          setCanPlay(false);
          const tempUser: User = {
            ...user,
            gamesPlayed: [
              ...(user.gamesPlayed || []),
              {
                gameId: JIGSAW_GAME_ID,
                gameName: JIGSAW_GAME_NAME,
                playedAt: new Date(),
                score,
                pointsEarned: coins,
                completed: true
              }
            ]
          };
          setNextPlayTime(getNextPlayTime(tempUser, JIGSAW_GAME_ID));
          return;
        }
        setGameMessage(
          "❌ Failed to save your game progress. Please try again."
        );
        return;
      }

      if (data.success) {
        const newGameRecord = {
          gameId: JIGSAW_GAME_ID,
          gameName: JIGSAW_GAME_NAME,
          playedAt: new Date(),
          score,
          pointsEarned: coins,
          completed: true
        };

        const updatedUser: User = {
          ...user,
          userPoints: data.totalPoints || user.userPoints,
          gamesPlayed: [...(user.gamesPlayed || []), newGameRecord]
        };

        setUser(updatedUser);
        setNextPlayTime(getNextPlayTime(updatedUser, JIGSAW_GAME_ID));
        setCanPlay(false);
        setGameMessage(
          `🎉 Congratulations! You earned ${coins} coins! Come back tomorrow to play again.`
        );
      }
    } catch (e) {
      console.error("Exception during game completion:", e);
      setGameMessage(
        "❌ An error occurred while saving your progress. Please try again."
      );
    }
  }, [user, time, moves, hintsUsed]);

  useEffect(() => {
    if (
      placedPieces === TOTAL_PIECES &&
      TOTAL_PIECES > 0 &&
      !gameCompleted &&
      canPlay
    ) {
      finishGame();
    }
  }, [placedPieces, gameCompleted, canPlay, finishGame]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /* AUTH / LOADING STATES */

  if (authLoading) {
    return (
      <div className="puzzle-loading-screen">
        <div className="puzzle-loading-message">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="puzzle-loading-screen">
        <div className="puzzle-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="puzzle-loading-screen">
        <div className="puzzle-loading-message">Redirecting to login...</div>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div className="puzzle-game-container">
        <div className="puzzle-game-wrapper">
          <header className="puzzle-game-header">
            <div className="puzzle-header-card">
              <div className="puzzle-header-content">
                <div>
                  <h1 className="puzzle-game-title">
                    <Puzzle className="puzzle-title-icon" />
                    Jigsaw Puzzle Challenge
                  </h1>
                  <p className="puzzle-welcome-message">
                    Welcome,{" "}
                    <span className="puzzle-username">{user.name}</span>!
                  </p>
                </div>
                <div className="puzzle-user-coins">
                  <div className="puzzle-coins-display">
                    <Coins className="puzzle-coins-icon" />
                    <span className="puzzle-coins-value">
                      {user.userPoints}
                    </span>
                  </div>
                  <div className="puzzle-coins-label">Total Coins</div>
                </div>
              </div>
            </div>
          </header>

          <div className="puzzle-already-played">
            <div className="puzzle-locked-card">
              <AlertCircle className="puzzle-lock-icon" />
              <h2 className="puzzle-locked-title">
                Game Already Played Today
              </h2>
              <p className="puzzle-locked-message">
                {gameMessage ||
                  "🚫 You have already played Jigsaw Puzzle today!"}
              </p>
              <div className="puzzle-next-play-info">
                <p className="puzzle-next-play-label">Next available in:</p>
                <div className="puzzle-next-play-time">
                  {nextPlayTime || "Calculating..."}
                </div>
              </div>
              <p className="puzzle-locked-hint">
                Come back tomorrow for another challenge!
              </p>
              <button
                onClick={() => router.push("/zone")}
                className="puzzle-button puzzle-button-primary"
              >
                <Gamepad2 className="puzzle-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentGame || puzzlePieces.length === 0) {
    return (
      <div className="puzzle-loading-screen">
        <div className="puzzle-loading-message">Preparing puzzle...</div>
      </div>
    );
  }

  return (
    <div className="puzzle-game-container">
      <div className="puzzle-game-wrapper">
        <header className="puzzle-game-header">
          <div className="puzzle-header-card">
            <div className="puzzle-header-content">
              <div>
                <h1 className="puzzle-game-title">
                  <Puzzle className="puzzle-title-icon" />
                  Jigsaw Puzzle Challenge
                </h1>
                <p className="puzzle-welcome-message">
                  Welcome,{" "}
                  <span className="puzzle-username">{user.name}</span>!
                  Assemble the puzzle to earn coins.
                </p>
              </div>
              <div className="puzzle-user-coins">
                <div className="puzzle-coins-display">
                  <Coins className="puzzle-coins-icon" />
                  <span className="puzzle-coins-value">
                    {user.userPoints}
                  </span>
                </div>
                <div className="puzzle-coins-label">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        <div className="puzzle-stats-container">
          <div className="puzzle-stats-grid">
            <div className="puzzle-stat-card puzzle-stat-time">
              <div className="puzzle-stat-header">
                <Timer className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Time</span>
              </div>
              <div className="puzzle-stat-value">{formatTime(time)}</div>
            </div>

            <div className="puzzle-stat-card puzzle-stat-moves">
              <div className="puzzle-stat-header">
                <Zap className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Moves</span>
              </div>
              <div className="puzzle-stat-value">{moves}</div>
            </div>

            <div className="puzzle-stat-card puzzle-stat-pieces">
              <div className="puzzle-stat-header">
                <Trophy className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Pieces</span>
              </div>
              <div className="puzzle-stat-value">
                {placedPieces}/{TOTAL_PIECES}
              </div>
            </div>

            <div className="puzzle-stat-card puzzle-stat-hints">
              <div className="puzzle-stat-header">
                <HelpCircle className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Hints</span>
              </div>
              <div className="puzzle-stat-value">
                {HINT_COUNT - hintsUsed}
              </div>
            </div>
          </div>

          {feedbackMessage && (
            <div
              className={`puzzle-feedback-message ${
                feedbackMessage.includes("✅")
                  ? "puzzle-feedback-success"
                  : feedbackMessage.includes("❌")
                  ? "puzzle-feedback-error"
                  : "puzzle-feedback-hint"
              }`}
            >
              {feedbackMessage}
            </div>
          )}

          {gameMessage && (
            <div className="puzzle-game-message">
              <div
                className={`puzzle-message-card ${
                  gameMessage.includes("🎉")
                    ? "success"
                    : gameMessage.includes("🚫")
                    ? "error"
                    : "info"
                }`}
              >
                {gameMessage}
              </div>
            </div>
          )}
        </div>

        <div className="puzzle-controls-container">
          <div className="puzzle-controls-group">
            {/* New Puzzle & Next Puzzle removed as requested */}
            <button
              onClick={useHint}
              disabled={hintsUsed >= HINT_COUNT || gameCompleted}
              className="puzzle-button puzzle-button-hint"
            >
              <HelpCircle className="puzzle-button-icon" />
              Use Hint ({HINT_COUNT - hintsUsed} left)
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="puzzle-button puzzle-button-secondary"
            >
              {showPreview ? (
                <EyeOff className="puzzle-button-icon" />
              ) : (
                <Eye className="puzzle-button-icon" />
              )}
              {showPreview ? "Hide" : "Show"} Preview
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className="puzzle-button puzzle-button-secondary"
            >
              <Grid className="puzzle-button-icon" />
              {showGrid ? "Hide" : "Show"} Grid
            </button>
          </div>
        </div>

        <div className="puzzle-game-area">
          <div className="puzzle-board-section">
            <div className="puzzle-board-card">
              <div className="puzzle-board-header">
                <h2 className="puzzle-board-title">
                  {currentGame?.name || "Jigsaw Puzzle"}
                </h2>
                {selectedPiece && (
                  <div className="puzzle-selected-indicator">
                    <Move className="puzzle-selected-icon" />
                    Piece #{selectedPiece.index + 1} selected
                  </div>
                )}
              </div>

              <div ref={gridRef} className="puzzle-grid-container">
                <div
                  className="puzzle-grid"
                  style={{
                    gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                    gridTemplateColumns: `repeat(${COLS}, 1fr)`
                  }}
                >
                  {Array.from({ length: ROWS }).map((_, rowIndex) =>
                    Array.from({ length: COLS }).map((_, colIndex) => {
                      const pieceInCell = gridState[rowIndex]?.[colIndex];
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() =>
                            handleGridCellClick(rowIndex, colIndex)
                          }
                          className={`puzzle-grid-cell ${
                            showGrid ? "puzzle-grid-show" : ""
                          } ${
                            pieceInCell
                              ? pieceInCell.isCorrect
                                ? "puzzle-cell-correct"
                                : "puzzle-cell-wrong"
                              : "puzzle-cell-empty"
                          }`}
                        >
                          {pieceInCell && (
                            <div
                              className="puzzle-piece-visual"
                              style={{
                                backgroundImage: `url(${currentGame.imageUrl})`,
                                backgroundSize: getPieceBackgroundSize(),
                                backgroundPosition: getPieceBackgroundPosition(
                                  pieceInCell.index
                                )
                              }}
                            >
                              <div className="puzzle-piece-status">
                                {pieceInCell.isCorrect ? (
                                  <Check className="puzzle-status-icon puzzle-status-correct" />
                                ) : (
                                  <XIcon className="puzzle-status-icon puzzle-status-wrong" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {gameCompleted && (
                  <div className="puzzle-completion-overlay">
                    <div className="puzzle-completion-card">
                      <div className="puzzle-completion-emoji">🎉</div>
                      <h3 className="puzzle-completion-title">
                        Puzzle Complete!
                      </h3>
                      <p className="puzzle-completion-text">
                        Time: {formatTime(time)} • Moves: {moves}
                      </p>
                      <div className="puzzle-coins-earned">
                        +{earnedCoins} coins earned!
                      </div>
                      <div className="puzzle-total-coins">
                        Total coins:{" "}
                        <span className="puzzle-total-coins-value">
                          {user.userPoints}
                        </span>
                      </div>

                      {gameMessage && (
                        <div className="puzzle-game-status">
                          <p>{gameMessage}</p>
                        </div>
                      )}

                      <div className="puzzle-next-play-info">
                        <p>Come back tomorrow for a new puzzle!</p>
                        <p className="puzzle-next-play-hint">
                          Next play available:{" "}
                          {nextPlayTime || "Calculating..."}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/zone")}
                        className="puzzle-button puzzle-button-primary"
                      >
                        <Gamepad2 className="puzzle-button-icon" />
                        Return to Game Zone
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!gameStarted && (
                <div className="puzzle-instructions">
                  <p className="puzzle-instructions-text">
                    💡 <strong>How to play:</strong> Click a piece from the
                    side tray, then click on an empty grid cell to place it.
                    Correct pieces stay, wrong pieces disappear. Complete all{" "}
                    {TOTAL_PIECES} pieces to win!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="puzzle-side-panels">
            {showPreview && currentGame && (
              <div className="puzzle-preview-card">
                <h3 className="puzzle-side-title">
                  <Eye className="puzzle-side-icon" />
                  Original Image
                </h3>
                <div className="puzzle-preview-image">
                  <img
                    src={currentGame.imageUrl}
                    alt={currentGame.name}
                    className="puzzle-preview-img"
                  />
                </div>
                <p className="puzzle-preview-caption">
                  Complete this {ROWS}×{COLS} puzzle
                </p>
              </div>
            )}

            <div className="puzzle-pieces-tray">
              <h3 className="puzzle-side-title">
                Puzzle Pieces (
                {puzzlePieces.filter((p) => !p.isPlaced).length} remaining)
              </h3>
              <div className="puzzle-pieces-grid">
                {puzzlePieces
                  .filter((piece) => !piece.isPlaced)
                  .map((piece) => (
                    <button
                      key={piece.index}
                      onClick={() => handlePieceSelect(piece)}
                      className={`puzzle-piece-thumbnail ${
                        selectedPiece?.index === piece.index
                          ? "puzzle-piece-selected"
                          : ""
                      }`}
                      style={{
                        backgroundImage: `url(${currentGame.imageUrl})`,
                        backgroundSize: getPieceBackgroundSize(),
                        backgroundPosition: getPieceBackgroundPosition(
                          piece.index
                        )
                      }}
                      title={`Piece ${piece.index + 1}`}
                    />
                  ))}
              </div>
              <p className="puzzle-pieces-hint">
                Click a piece to select it, then click on the grid to place it
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
