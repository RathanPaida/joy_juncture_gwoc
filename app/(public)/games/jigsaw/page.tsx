"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Timer, 
  RefreshCw, 
  Trophy, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Puzzle,
  Zap,
  Move,
  Check,
  X,
  Coins,
  Lock,
  Grid,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./jigsaw-puzzle-game.css";

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

interface Game {
  id: string;
  name: string;
  imageUrl: string;
  category: string[];
  players: string;
  duration: string;
}

interface PuzzlePiece {
  id: number;
  correctRow: number;
  correctCol: number;
  isPlaced: boolean;
  isCorrect: boolean;
  imageUrl: string;
}

const JIGSAW_GAME_ID = "jigsaw-puzzle";
const JIGSAW_GAME_NAME = "Jigsaw Puzzle";

/* ---------------- HELPER FUNCTIONS ---------------- */

// Check if user has played this game today (USE UTC)
const hasPlayedToday = (user: User | null, gameId: string): boolean => {
  if (!user || !user.gamesPlayed) return false;

  // Use UTC to avoid timezone issues (same as backend)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const gameRecord = user.gamesPlayed.find(
    (game) => game.gameId === gameId
  );

  if (!gameRecord) return false;

  const playedDate = new Date(gameRecord.playedAt);
  const playedUTC = new Date(Date.UTC(
    playedDate.getUTCFullYear(),
    playedDate.getUTCMonth(),
    playedDate.getUTCDate()
  ));

  return playedUTC.getTime() === todayUTC.getTime();
};

// Get next available play time (USE UTC)
const getNextPlayTime = (user: User | null, gameId: string): string => {
  if (!user || !user.gamesPlayed) return "Play Now";

  const gameRecord = user.gamesPlayed.find(
    (game) => game.gameId === gameId
  );

  if (!gameRecord) return "Play Now";

  // Use UTC dates (same as backend)
  const playedDate = new Date(gameRecord.playedAt);
  const playedUTC = new Date(Date.UTC(
    playedDate.getUTCFullYear(),
    playedDate.getUTCMonth(),
    playedDate.getUTCDate()
  ));
  
  // Tomorrow in UTC
  const tomorrowUTC = new Date(playedUTC);
  tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
  
  // Current time in UTC
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
};

/* ---------------- COMPONENT ---------------- */

export default function JigsawPuzzleGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [gridState, setGridState] = useState<(PuzzlePiece | null)[][]>([]);
  const [placedPieces, setPlacedPieces] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [canPlay, setCanPlay] = useState<boolean>(true);
  const [nextPlayTime, setNextPlayTime] = useState<string>("");
  const [gameMessage, setGameMessage] = useState<string>("");
  
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fixed 4x4 grid
  const ROWS = 4;
  const COLS = 4;
  const TOTAL_PIECES = ROWS * COLS;
  const HINT_COUNT = 2;
  const BASE_COINS = 50;
  const TIME_LIMIT = 420; // 7 minutes

  /* ---------------- GET TOKEN HELPER ---------------- */
  const getIdToken = async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("No Firebase user found");
        return null;
      }
      
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
      
      if (!token) {
        console.error("Failed to get authentication token");
        return null;
      }
      
      const res = await fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        console.error("Failed to fetch user data:", res.status);
        return null;
      }

      const data = await res.json();
      if (data.success) {
        console.log("✅ User data fetched for Jigsaw Puzzle:", {
          name: data.user.name,
          userPoints: data.user.userPoints,
          gamesPlayedCount: data.user.gamesPlayed?.length,
          hasPlayedToday: hasPlayedToday(data.user, JIGSAW_GAME_ID)
        });
        return data.user;
      } else {
        console.error("User data fetch unsuccessful:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }, []);

  /* ---------------- AUTHENTICATION CHECK ---------------- */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUser) {
      router.push("/login");
      return;
    }

    const initUser = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setUser(userData);
        
        // Check if user can play today
        const playedToday = hasPlayedToday(userData, JIGSAW_GAME_ID);
        console.log("🔍 Can user play Jigsaw today?", {
          playedToday,
          gameId: JIGSAW_GAME_ID,
          gamesPlayed: userData.gamesPlayed?.filter(g => g.gameId === JIGSAW_GAME_ID)
        });
        
        setCanPlay(!playedToday);
        
        if (playedToday) {
          const nextTime = getNextPlayTime(userData, JIGSAW_GAME_ID);
          console.log("⏰ Next play time:", nextTime);
          setNextPlayTime(nextTime);
          setGameMessage("🚫 You have already played Jigsaw Puzzle today!");
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
        setNextPlayTime(getNextPlayTime(user, JIGSAW_GAME_ID));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  /* ---------------- HELPER FUNCTIONS ---------------- */

  const getPieceBackgroundPosition = (row: number, col: number): string => {
    const xPercent = (col / (COLS - 1)) * 100;
    const yPercent = (row / (ROWS - 1)) * 100;
    return `${xPercent}% ${yPercent}%`;
  };

  const getPieceBackgroundSize = (): string => {
    return `${COLS * 100}% ${ROWS * 100}%`;
  };

  const shufflePieces = (pieces: PuzzlePiece[]): PuzzlePiece[] => {
    const shuffled = [...pieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /* ---------------- FETCH GAMES ---------------- */

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/games/public');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          const formattedGames = data.data.map((game: any) => ({
            id: game.id?.toString() || Math.random().toString(36).substr(2, 9),
            name: game.name || 'Unnamed Game',
            imageUrl: game.imageUrl || game.image || 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=600&h=400&fit=crop',
            category: Array.isArray(game.category) ? game.category : [game.category || ''],
            players: game.players || '2-4',
            duration: game.duration || '30-60 min'
          }));
          
          setGames(formattedGames);
          if (formattedGames.length > 0) {
            setCurrentGame(formattedGames[Math.floor(Math.random() * formattedGames.length)]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching games:', err);
      }
    };

    fetchGames();
  }, []);

  /* ---------------- INITIALIZE GAME ---------------- */

  const initializeGame = useCallback(() => {
    if (!currentGame || !canPlay) return;

    const pieces: PuzzlePiece[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const id = row * COLS + col;
        pieces.push({
          id,
          correctRow: row,
          correctCol: col,
          isPlaced: false,
          isCorrect: false,
          imageUrl: currentGame.imageUrl,
        });
      }
    }

    const initialGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    const shuffledPieces = shufflePieces([...pieces]);
    
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

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [currentGame, canPlay]);

  useEffect(() => {
    if (currentGame && canPlay) {
      initializeGame();
    }
  }, [currentGame, canPlay, initializeGame]);

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

    const isCorrect = selectedPiece.correctRow === row && selectedPiece.correctCol === col;

    const newGridState = [...gridState];
    newGridState[row][col] = {
      ...selectedPiece,
      isPlaced: true,
      isCorrect: isCorrect
    };
    setGridState(newGridState);

    setPuzzlePieces(prev => prev.map(p => 
      p.id === selectedPiece.id 
        ? { ...p, isPlaced: true, isCorrect: isCorrect }
        : p
    ));

    setMoves(prev => prev + 1);
    
    if (isCorrect) {
      setPlacedPieces(prev => prev + 1);
      setFeedbackMessage("✅ Correct placement!");
      setTimeout(() => setFeedbackMessage(""), 1500);
    } else {
      setFeedbackMessage("❌ Wrong position! Try again.");
      setTimeout(() => setFeedbackMessage(""), 1500);
      
      setTimeout(() => {
        setGridState(prev => {
          const updatedGrid = [...prev];
          if (updatedGrid[row][col]?.id === selectedPiece.id) {
            updatedGrid[row][col] = null;
          }
          return updatedGrid;
        });
        
        setPuzzlePieces(prev => prev.map(p => 
          p.id === selectedPiece.id 
            ? { ...p, isPlaced: false, isCorrect: false }
            : p
        ));
      }, 1500);
    }

    setSelectedPiece(null);
  };

  const useHint = () => {
    if (hintsUsed >= HINT_COUNT || gameCompleted || !canPlay) return;
    
    const unplacedPiece = puzzlePieces.find(p => !p.isPlaced);
    if (!unplacedPiece) return;

    setSelectedPiece(unplacedPiece);
    setHintsUsed(prev => prev + 1);
    
    setFeedbackMessage(`💡 Hint: Piece ${unplacedPiece.id + 1} belongs at row ${unplacedPiece.correctRow + 1}, column ${unplacedPiece.correctCol + 1}`);
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  /* ---------------- CALCULATE COINS ---------------- */

  const calculateCoins = () => {
    const timeBonus = Math.max(0, Math.floor((TIME_LIMIT - time) / 10));
    const optimalMoves = TOTAL_PIECES;
    const movesPenalty = Math.max(0, (moves - optimalMoves) * 2);
    const hintPenalty = hintsUsed * 10;
    const totalCoins = Math.max(10, BASE_COINS + timeBonus - movesPenalty - hintPenalty);
    return totalCoins;
  };

  /* ---------------- FINISH GAME ---------------- */

  const finishGame = async () => {
    setGameCompleted(true);
    
    const coins = calculateCoins();
    setEarnedCoins(coins);

    if (!user) {
      console.error("❌ No user found when finishing game");
      return;
    }

    console.log("🎮 Jigsaw Puzzle completed! Attempting to mark as played and add coins:", { 
      gameId: JIGSAW_GAME_ID,
      gameName: JIGSAW_GAME_NAME,
      userId: user._id, 
      coinsToAdd: coins,
      currentPoints: user.userPoints
    });

    try {
      const token = await getIdToken();
      
      if (!token) {
        console.error("❌ Failed to get authentication token");
        setGameMessage("❌ Failed to save your progress. Please check your connection.");
        return;
      }

      console.log("✅ Token obtained successfully");

      // Calculate score for the game
      const score = Math.max(0, 1000 - Math.floor(time / 10) - (moves * 2) - (hintsUsed * 100));

      // Mark game as played (once per day)
      const markPlayedResponse = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: JIGSAW_GAME_ID,
          gameName: JIGSAW_GAME_NAME,
          score: score,
          pointsEarned: coins
        })
      });

      const responseData = await markPlayedResponse.json();
      
      if (!markPlayedResponse.ok) {
        console.error("❌ Failed to mark game as played:", responseData);
        
        // Check for different error messages
        if (responseData.error?.includes("Game already played") || 
            responseData.error?.includes("once per day") ||
            responseData.error?.includes("once.")) {
          console.log("⚠️ Game already played today");
          
          // Set message for user
          setGameMessage("🚫 You have already played this game today! Come back tomorrow.");
          
          setCanPlay(false);
          
          // Update next play time
          const tempUser = {
            ...user,
            gamesPlayed: [
              ...(user.gamesPlayed || []),
              {
                gameId: JIGSAW_GAME_ID,
                gameName: JIGSAW_GAME_NAME,
                playedAt: new Date(),
                score: score,
                pointsEarned: coins,
                completed: true
              }
            ]
          };
          setNextPlayTime(getNextPlayTime(tempUser, JIGSAW_GAME_ID));
          
          // Refresh user data
          const refreshedUser = await fetchUserData();
          if (refreshedUser) {
            setUser(refreshedUser);
          }
          return;
        }
        
        setGameMessage("❌ Failed to save your game progress. Please try again.");
        throw new Error(responseData.error || "Failed to save your game progress");
      }

      console.log("✅ Game marked as played:", responseData);

      // Game saved successfully
      if (responseData.success) {
        // Update user state with new points
        setUser(prev => prev ? {
          ...prev,
          userPoints: responseData.totalPoints || prev.userPoints
        } : prev);
        
        setCanPlay(false);
        
        // Get next play time
        if (user.gamesPlayed) {
          const updatedGames = [...user.gamesPlayed, {
            gameId: JIGSAW_GAME_ID,
            gameName: JIGSAW_GAME_NAME,
            playedAt: new Date(),
            score: score,
            pointsEarned: coins,
            completed: true
          }];
          const tempUser = { ...user, gamesPlayed: updatedGames };
          const nextTime = getNextPlayTime(tempUser, JIGSAW_GAME_ID);
          console.log("⏰ Setting next play time to:", nextTime);
          setNextPlayTime(nextTime);
        }
        
        // Set success message
        setGameMessage(`🎉 Congratulations! You earned ${coins} coins! Come back tomorrow to play again.`);
        
        // Also refresh full user data
        const refreshedUser = await fetchUserData();
        if (refreshedUser) {
          console.log("✅ User data refreshed successfully!");
          console.log("💰 New user points:", refreshedUser.userPoints);
          setUser(refreshedUser);
        }
      }

    } catch (error) {
      console.error("❌ Exception during game completion:", error);
      setGameMessage("❌ An error occurred while saving your progress. Please try again.");
    }
  };

  /* ---------------- CHECK IF PUZZLE COMPLETE ---------------- */

  useEffect(() => {
    if (placedPieces === TOTAL_PIECES && TOTAL_PIECES > 0 && !gameCompleted && canPlay) {
      finishGame();
    }
  }, [placedPieces, gameCompleted, canPlay]);

  /* ---------------- CALCULATE SCORE ---------------- */

  const calculateScore = () => {
    if (!gameCompleted) return 0;
    
    const timeBonus = Math.max(0, 1000 - Math.floor(time / 10));
    const movesBonus = Math.max(0, 500 - moves * 2);
    const hintPenalty = hintsUsed * 100;
    
    return Math.max(0, (timeBonus + movesBonus - hintPenalty) * 2);
  };

  /* ---------------- FORMAT TIME ---------------- */

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------------- NEXT PUZZLE ---------------- */

  const nextPuzzle = () => {
    if (games.length > 0) {
      const currentIndex = games.findIndex(g => g.id === currentGame?.id);
      const nextIndex = (currentIndex + 1) % games.length;
      setCurrentGame(games[nextIndex]);
      initializeGame();
    }
  };

  /* ---------------- UI RENDER ---------------- */

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
        <div className="puzzle-loading-message">Loading game data...</div>
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

  // Show "Already Played" screen
  if (!canPlay && !gameStarted) {
    console.log("🔒 Showing already played screen");
    return (
      <div className="puzzle-game-container">
        <div className="puzzle-game-wrapper">
          {/* Header */}
          <header className="puzzle-game-header">
            <div className="puzzle-header-card">
              <div className="puzzle-header-content">
                <div>
                  <h1 className="puzzle-game-title">
                    <Puzzle className="puzzle-title-icon" />
                    Jigsaw Puzzle Game
                  </h1>
                  <p className="puzzle-welcome-message">
                    Welcome, <span className="puzzle-username">{user.name}</span>!
                  </p>
                </div>
                <div className="puzzle-user-coins">
                  <div className="puzzle-coins-display">
                    <Coins className="puzzle-coins-icon" />
                    <span className="puzzle-coins-value">{user.userPoints}</span>
                  </div>
                  <div className="puzzle-coins-label">Total Coins</div>
                </div>
              </div>
            </div>
          </header>

          {/* Already Played Message - SIMPLIFIED */}
          <div className="puzzle-already-played">
            <div className="puzzle-locked-card">
              <AlertCircle className="puzzle-lock-icon" />
              <h2 className="puzzle-locked-title">Daily Limit Reached</h2>
              <p className="puzzle-locked-message">
                You've already played Jigsaw Puzzle today!
              </p>
              
              <div className="puzzle-next-play-info">
                <p className="puzzle-next-play-label">Come back in:</p>
                <div className="puzzle-next-play-time">{nextPlayTime || "Calculating..."}</div>
              </div>
              
              <p className="puzzle-locked-hint">
                Play again tomorrow for more coins!
              </p>
              
              <div className="puzzle-action-buttons">
                <button
                  onClick={() => router.push("/home")}
                  className="puzzle-button puzzle-button-primary"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => router.push("/games")}
                  className="puzzle-button puzzle-button-secondary"
                >
                  Browse Other Games
                </button>
              </div>
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

  const score = calculateScore();

  return (
    <div className="puzzle-game-container">
      <div className="puzzle-game-wrapper">
        {/* Header with User Info */}
        <header className="puzzle-game-header">
          <div className="puzzle-header-card">
            <div className="puzzle-header-content">
              <div>
                <h1 className="puzzle-game-title">
                  <Puzzle className="puzzle-title-icon" />
                  Jigsaw Puzzle Game (4×4)
                </h1>
                <p className="puzzle-welcome-message">
                  Welcome, <span className="puzzle-username">{user.name}</span>! Assemble the puzzle to earn coins.
                </p>
              </div>
              <div className="puzzle-user-coins">
                <div className="puzzle-coins-display">
                  <Coins className="puzzle-coins-icon" />
                  <span className="puzzle-coins-value">{user.userPoints}</span>
                </div>
                <div className="puzzle-coins-label">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        {/* Game Stats */}
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
              <div className="puzzle-stat-value">{placedPieces}/{TOTAL_PIECES}</div>
            </div>

            <div className="puzzle-stat-card puzzle-stat-hints">
              <div className="puzzle-stat-header">
                <HelpCircle className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Hints</span>
              </div>
              <div className="puzzle-stat-value">{HINT_COUNT - hintsUsed}</div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div className={`puzzle-feedback-message ${
              feedbackMessage.includes("✅") 
                ? "puzzle-feedback-success" 
                : feedbackMessage.includes("❌")
                ? "puzzle-feedback-error"
                : "puzzle-feedback-hint"
            }`}>
              {feedbackMessage}
            </div>
          )}

          {/* Game Message */}
          {gameMessage && (
            <div className="puzzle-game-message">
              <div className={`puzzle-message-card ${gameMessage.includes("🎉") ? 'success' : gameMessage.includes("🚫") ? 'error' : 'info'}`}>
                {gameMessage}
              </div>
            </div>
          )}

          {/* Game Controls */}
          <div className="puzzle-controls-container">
            <div className="puzzle-controls-group">
              <button
                onClick={initializeGame}
                className="puzzle-button puzzle-button-restart"
              >
                <RefreshCw className="puzzle-button-icon" />
                Restart Puzzle
              </button>

              <button
                onClick={nextPuzzle}
                className="puzzle-button puzzle-button-next"
              >
                Next Game
              </button>

              <button
                onClick={useHint}
                disabled={hintsUsed >= HINT_COUNT || gameCompleted}
                className="puzzle-button puzzle-button-hint"
              >
                <HelpCircle className="puzzle-button-icon" />
                Use Hint ({HINT_COUNT - hintsUsed} left)
              </button>
            </div>

            <div className="puzzle-view-controls">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="puzzle-button puzzle-button-secondary"
              >
                {showPreview ? <EyeOff className="puzzle-button-icon" /> : <Eye className="puzzle-button-icon" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className="puzzle-button puzzle-button-secondary"
              >
                <Grid className="puzzle-button-icon" />
                {showGrid ? 'Hide' : 'Show'} Grid
              </button>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="puzzle-game-area">
          {/* Puzzle Board */}
          <div className="puzzle-board-section">
            <div className="puzzle-board-card">
              <div className="puzzle-board-header">
                <h2 className="puzzle-board-title">
                  {currentGame?.name || 'Game Puzzle'}
                </h2>
                {selectedPiece && (
                  <div className="puzzle-selected-indicator">
                    <Move className="puzzle-selected-icon" />
                    Piece #{selectedPiece.id + 1} selected
                  </div>
                )}
              </div>

              {/* Puzzle Grid */}
              <div 
                ref={gridRef}
                className="puzzle-grid-container"
              >
                <div className="puzzle-grid" style={{ 
                  gridTemplateRows: `repeat(${ROWS}, 1fr)`, 
                  gridTemplateColumns: `repeat(${COLS}, 1fr)` 
                }}>
                  {Array.from({ length: ROWS }).map((_, rowIndex) => (
                    Array.from({ length: COLS }).map((_, colIndex) => {
                      const pieceInCell = gridState[rowIndex]?.[colIndex];
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleGridCellClick(rowIndex, colIndex)}
                          className={`puzzle-grid-cell ${showGrid ? 'puzzle-grid-show' : ''} ${
                            pieceInCell ? (
                              pieceInCell.isCorrect ? 'puzzle-cell-correct' : 'puzzle-cell-wrong'
                            ) : 'puzzle-cell-empty'
                          }`}
                        >
                          {pieceInCell && (
                            <div
                              className="puzzle-piece-visual"
                              style={{
                                backgroundImage: `url(${pieceInCell.imageUrl})`,
                                backgroundSize: getPieceBackgroundSize(),
                                backgroundPosition: getPieceBackgroundPosition(
                                  pieceInCell.correctRow,
                                  pieceInCell.correctCol
                                ),
                              }}
                            >
                              <div className="puzzle-piece-status">
                                {pieceInCell.isCorrect ? (
                                  <Check className="puzzle-status-icon puzzle-status-correct" />
                                ) : (
                                  <X className="puzzle-status-icon puzzle-status-wrong" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ))}
                </div>
                
                {/* Game Completed Overlay */}
                {gameCompleted && (
                  <div className="puzzle-completion-overlay">
                    <div className="puzzle-completion-card">
                      <div className="puzzle-completion-emoji">🎉</div>
                      <h3 className="puzzle-completion-title">Puzzle Complete!</h3>
                      <p className="puzzle-completion-text">
                        You finished in {formatTime(time)} with {moves} moves
                      </p>
                      <div className="puzzle-coins-earned">
                        +{earnedCoins} coins earned!
                      </div>
                      <div className="puzzle-total-coins">
                        Total coins: <span className="puzzle-total-coins-value">{user.userPoints}</span>
                      </div>
                      
                      {/* Show game message if exists */}
                      {gameMessage && (
                        <div className="puzzle-game-status">
                          <p>{gameMessage}</p>
                        </div>
                      )}
                      
                      <div className="puzzle-next-play-info">
                        <p>Come back tomorrow to play again!</p>
                        <p className="puzzle-next-play-hint">Next play available: {nextPlayTime || "Calculating..."}</p>
                      </div>
                      <button
                        onClick={() => router.push("/home")}
                        className="puzzle-button puzzle-button-primary"
                      >
                        Return to Home
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {!gameStarted && (
                <div className="puzzle-instructions">
                  <p className="puzzle-instructions-text">
                    💡 <strong>How to play:</strong> Click a piece from the side tray, then click on an empty grid cell to place it. Correct pieces stay, wrong pieces disappear. Complete all {TOTAL_PIECES} pieces to win and earn coins!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panels */}
          <div className="puzzle-side-panels">
            {/* Game Preview */}
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
                  Complete this 4×4 puzzle
                </p>
              </div>
            )}

            {/* Puzzle Pieces Tray */}
            <div className="puzzle-pieces-tray">
              <h3 className="puzzle-side-title">
                Puzzle Pieces ({puzzlePieces.filter(p => !p.isPlaced).length} remaining)
              </h3>
              <div className="puzzle-pieces-grid">
                {puzzlePieces
                  .filter(piece => !piece.isPlaced)
                  .map(piece => (
                    <button
                      key={piece.id}
                      onClick={() => handlePieceSelect(piece)}
                      className={`puzzle-piece-thumbnail ${selectedPiece?.id === piece.id ? 'puzzle-piece-selected' : ''}`}
                      style={{
                        backgroundImage: `url(${piece.imageUrl})`,
                        backgroundSize: getPieceBackgroundSize(),
                        backgroundPosition: getPieceBackgroundPosition(
                          piece.correctRow,
                          piece.correctCol
                        ),
                      }}
                      title={`Piece ${piece.id + 1}`}
                    />
                  ))}
              </div>
              <p className="puzzle-pieces-hint">
                Click a piece to select it, then click on the grid to place it
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="puzzle-game-footer">
          <p>
            🧩 Jigsaw Puzzle Game • 4×4 Grid • {games.length} games available • Once per day
          </p>
        </footer>
      </div>
    </div>
  );
}