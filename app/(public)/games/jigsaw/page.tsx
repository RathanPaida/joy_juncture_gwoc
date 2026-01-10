"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Timer, 
  RefreshCw, 
  Trophy, 
  Grid, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Star,
  Puzzle,
  Zap,
  Shuffle,
  Move,
  Check,
  X,
  Coins
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
}

interface Game {
  id: string;
  name: string;
  description: string;
  category: string[];
  players: string;
  duration: string;
  features: string[];
  imageUrl: string;
  regularPrice: string;
  salePrice: string;
}

interface PuzzlePiece {
  id: number;
  correctRow: number;
  correctCol: number;
  isPlaced: boolean;
  isCorrect: boolean;
  imageUrl: string;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

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
  const [error, setError] = useState<string | null>(null);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const difficultySettings = {
    easy: { rows: 3, cols: 3, timeLimit: 300, hintCount: 3, baseCoins: 30 },
    medium: { rows: 4, cols: 4, timeLimit: 420, hintCount: 2, baseCoins: 50 },
    hard: { rows: 5, cols: 5, timeLimit: 600, hintCount: 1, baseCoins: 75 },
    expert: { rows: 6, cols: 6, timeLimit: 900, hintCount: 0, baseCoins: 100 }
  };

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
        setLoading(false);
      } else {
        router.push("/login");
      }
    };

    initUser();
  }, [authUser, authLoading, router, fetchUserData]);

  /* ---------------- HELPER FUNCTIONS ---------------- */

  const getPieceBackgroundPosition = (row: number, col: number, rows: number, cols: number): string => {
    const xPercent = (col / (cols - 1)) * 100;
    const yPercent = (row / (rows - 1)) * 100;
    return `${xPercent}% ${yPercent}%`;
  };

  const getPieceBackgroundSize = (rows: number, cols: number): string => {
    return `${cols * 100}% ${rows * 100}%`;
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
            description: game.description || '',
            category: Array.isArray(game.category) ? game.category : [game.category || ''],
            players: game.players || '',
            duration: game.duration || '',
            features: Array.isArray(game.features) ? game.features : [],
            imageUrl: game.imageUrl || game.image || 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=600&h=400&fit=crop',
            regularPrice: game.regularPrice || '',
            salePrice: game.salePrice || ''
          }));
          
          setGames(formattedGames);
          setCurrentGame(formattedGames[Math.floor(Math.random() * formattedGames.length)]);
        }
      } catch (err: any) {
        console.error('Error fetching games:', err);
        setError(err.message);
      }
    };

    fetchGames();
  }, []);

  /* ---------------- INITIALIZE GAME ---------------- */

  const initializeGame = useCallback(() => {
    if (!currentGame) return;

    const { rows, cols } = difficultySettings[difficulty];
    
    const pieces: PuzzlePiece[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
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

    const initialGrid = Array(rows).fill(null).map(() => Array(cols).fill(null));
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
  }, [currentGame, difficulty]);

  useEffect(() => {
    if (currentGame && !loading) {
      initializeGame();
    }
  }, [currentGame, difficulty, initializeGame, loading]);

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

  const handlePieceSelect = (piece: PuzzlePiece) => {
    if (piece.isPlaced || gameCompleted) return;
    setSelectedPiece(piece);
    if (!gameStarted) setGameStarted(true);
  };

  const handleGridCellClick = (row: number, col: number) => {
    if (!selectedPiece || gameCompleted) return;

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
    if (hintsUsed >= difficultySettings[difficulty].hintCount || gameCompleted) return;
    
    const unplacedPiece = puzzlePieces.find(p => !p.isPlaced);
    if (!unplacedPiece) return;

    setSelectedPiece(unplacedPiece);
    setHintsUsed(prev => prev + 1);
    
    setFeedbackMessage(`💡 Hint: Piece ${unplacedPiece.id + 1} belongs at row ${unplacedPiece.correctRow + 1}, column ${unplacedPiece.correctCol + 1}`);
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  /* ---------------- CALCULATE COINS ---------------- */

  const calculateCoins = () => {
    const { baseCoins, timeLimit } = difficultySettings[difficulty];
    const timeBonus = Math.max(0, Math.floor((timeLimit - time) / 10));
    const { rows, cols } = difficultySettings[difficulty];
    const optimalMoves = rows * cols;
    const movesPenalty = Math.max(0, (moves - optimalMoves) * 2);
    const hintPenalty = hintsUsed * 10;
    const totalCoins = Math.max(10, baseCoins + timeBonus - movesPenalty - hintPenalty);
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

    console.log("🎮 Puzzle completed! Attempting to add coins:", { 
      userId: user._id, 
      coinsToAdd: coins, 
      currentPoints: user.userPoints,
      expectedPoints: user.userPoints + coins
    });

    try {
      const token = await getIdToken();
      
      if (!token) {
        console.error("❌ Failed to get authentication token");
        alert("Failed to save your coins. Please check your connection and try again.");
        return;
      }

      console.log("✅ Token obtained successfully");
      console.log("📤 Making API call to /api/user/addCoins with payload:", { 
        userId: user._id, 
        coinsToAdd: coins 
      });

      const response = await fetch("/api/user/addCoins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user._id, 
          coinsToAdd: coins 
        })
      });

      console.log("📥 API response status:", response.status);
      console.log("📥 API response headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("📥 Raw API response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        console.error("Response text was:", responseText);
        alert(`Failed to parse server response. Check console for details.`);
        return;
      }

      console.log("📥 Parsed API response:", data);

      if (!response.ok) {
        console.error("❌ API request failed with status:", response.status);
        console.error("Error data:", data);
        alert(`Failed to update coins: ${data.error || response.statusText}`);
        return;
      }
      
      if (data.success) {
        console.log("✅ Coins added successfully!");
        console.log("💰 New points from API:", data.userPoints);
        
        // Refresh user data from backend to ensure UI is in sync
        console.log("🔄 Refreshing user data from backend...");
        const refreshedUser = await fetchUserData();
        if (refreshedUser) {
          console.log("✅ User data refreshed successfully!");
          console.log("💰 Refreshed user points:", refreshedUser.userPoints);
          setUser(refreshedUser);
        } else {
          console.warn("⚠️ Failed to refresh user data, using API response");
          setUser({ ...user, userPoints: data.userPoints });
        }
      } else {
        console.error("❌ API returned success:false:", data.error);
        alert(`Failed to update coins: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Exception during coin update:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      alert("An error occurred while updating coins. Please check the console for details.");
    }
  };

  /* ---------------- CHECK IF PUZZLE COMPLETE ---------------- */

  useEffect(() => {
    const { rows, cols } = difficultySettings[difficulty];
    const totalPieces = rows * cols;
    
    if (placedPieces === totalPieces && totalPieces > 0 && !gameCompleted) {
      finishGame();
    }
  }, [placedPieces, difficulty, gameCompleted]);

  /* ---------------- CALCULATE SCORE ---------------- */

  const calculateScore = () => {
    if (!gameCompleted) return 0;
    
    const { timeLimit } = difficultySettings[difficulty];
    const timeBonus = Math.max(0, 1000 - Math.floor(time / 10));
    const movesBonus = Math.max(0, 500 - moves * 2);
    const hintPenalty = hintsUsed * 100;
    const difficultyMultiplier = {
      easy: 1,
      medium: 2,
      hard: 3,
      expert: 4
    }[difficulty];
    
    return Math.max(0, (timeBonus + movesBonus - hintPenalty) * difficultyMultiplier);
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

  if (!currentGame || puzzlePieces.length === 0) {
    return (
      <div className="puzzle-loading-screen">
        <div className="puzzle-loading-message">Preparing puzzle...</div>
      </div>
    );
  }

  const { rows, cols, hintCount } = difficultySettings[difficulty];
  const gridSize = rows * cols;
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
                  Game Jigsaw Puzzle
                </h1>
                <p className="puzzle-welcome-message">
                  Welcome, <span className="puzzle-username">{user.name}</span>! Reconstruct game images to earn coins.
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

        {/* Game Stats & Controls */}
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
              <div className="puzzle-stat-value">{placedPieces}/{gridSize}</div>
            </div>

            <div className="puzzle-stat-card puzzle-stat-score">
              <div className="puzzle-stat-header">
                <Star className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Score</span>
              </div>
              <div className="puzzle-stat-value">{score}</div>
            </div>

            <div className="puzzle-stat-card puzzle-stat-hints">
              <div className="puzzle-stat-header">
                <HelpCircle className="puzzle-stat-icon" />
                <span className="puzzle-stat-label">Hints</span>
              </div>
              <div className="puzzle-stat-value">{hintCount - hintsUsed}</div>
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
                <Shuffle className="puzzle-button-icon" />
                Next Game
              </button>

              <button
                onClick={useHint}
                disabled={hintsUsed >= hintCount || gameCompleted}
                className="puzzle-button puzzle-button-hint"
              >
                <HelpCircle className="puzzle-button-icon" />
                Use Hint ({hintCount - hintsUsed} left)
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

          {/* Difficulty Selector */}
          <div className="puzzle-difficulty-container">
            <label className="puzzle-difficulty-label">
              Puzzle Difficulty (Higher difficulty = More coins!)
            </label>
            <div className="puzzle-difficulty-buttons">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  disabled={gameStarted && !gameCompleted}
                  className={`puzzle-difficulty-button ${difficulty === level ? 'puzzle-difficulty-active' : ''} ${gameStarted && !gameCompleted ? 'puzzle-difficulty-disabled' : ''}`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <span className="puzzle-difficulty-details">
                    ({difficultySettings[level].rows}×{difficultySettings[level].cols}) - {difficultySettings[level].baseCoins} coins
                  </span>
                </button>
              ))}
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
                style={{ minHeight: '500px' }}
              >
                <div className="puzzle-grid" style={{ 
                  gridTemplateRows: `repeat(${rows}, 1fr)`, 
                  gridTemplateColumns: `repeat(${cols}, 1fr)` 
                }}>
                  {Array.from({ length: rows }).map((_, rowIndex) => (
                    Array.from({ length: cols }).map((_, colIndex) => {
                      const pieceInCell = gridState[rowIndex]?.[colIndex];
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleGridCellClick(rowIndex, colIndex)}
                          className={`puzzle-grid-cell ${pieceInCell ? (pieceInCell.isCorrect ? 'puzzle-cell-correct' : 'puzzle-cell-wrong') : 'puzzle-cell-empty'}`}
                        >
                          {pieceInCell && (
                            <div
                              className="puzzle-piece-visual"
                              style={{
                                backgroundImage: `url(${pieceInCell.imageUrl})`,
                                backgroundSize: getPieceBackgroundSize(rows, cols),
                                backgroundPosition: getPieceBackgroundPosition(
                                  pieceInCell.correctRow,
                                  pieceInCell.correctCol,
                                  rows,
                                  cols
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
                      <button
                        onClick={nextPuzzle}
                        className="puzzle-button puzzle-button-primary"
                      >
                        Next Puzzle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {!gameStarted && (
                <div className="puzzle-instructions">
                  <p className="puzzle-instructions-text">
                    💡 <strong>How to play:</strong> Click a piece from the side tray, then click on an empty grid cell to place it. Correct pieces stay, wrong pieces disappear. Complete all {gridSize} pieces to win and earn coins!
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
                  This is what you are trying to recreate
                </p>
              </div>
            )}

            {/* Puzzle Pieces Tray */}
            <div className="puzzle-pieces-tray">
              <h3 className="puzzle-side-title">
                <Shuffle className="puzzle-side-icon" />
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
                        backgroundSize: getPieceBackgroundSize(rows, cols),
                        backgroundPosition: getPieceBackgroundPosition(
                          piece.correctRow,
                          piece.correctCol,
                          rows,
                          cols
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

            {/* Game Info */}
            {currentGame && (
              <div className="puzzle-game-info">
                <h3 className="puzzle-side-title">
                  Game Details
                </h3>
                <div className="puzzle-game-details">
                  <div className="puzzle-detail-item">
                    <p className="puzzle-detail-label">Players</p>
                    <p className="puzzle-detail-value">{currentGame.players}</p>
                  </div>
                  <div className="puzzle-detail-item">
                    <p className="puzzle-detail-label">Duration</p>
                    <p className="puzzle-detail-value">{currentGame.duration}</p>
                  </div>
                  <div className="puzzle-detail-item">
                    <p className="puzzle-detail-label">Categories</p>
                    <div className="puzzle-categories">
                      {currentGame.category.slice(0, 3).map((cat, idx) => (
                        <span
                          key={idx}
                          className="puzzle-category-tag"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="puzzle-game-footer">
          <p>
            🧩 Game Jigsaw Puzzle • Using {games.length} games • 
            Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </p>
        </footer>
      </div>
    </div>
  );
}