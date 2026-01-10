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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading game data...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  if (!currentGame || puzzlePieces.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Preparing puzzle...</div>
      </div>
    );
  }

  const { rows, cols, hintCount } = difficultySettings[difficulty];
  const gridSize = rows * cols;
  const score = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with User Info */}
        <header className="mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <Puzzle className="w-10 h-10 text-cyan-600" />
                  Game Jigsaw Puzzle
                </h1>
                <p className="text-gray-600">
                  Welcome, <span className="font-semibold">{user.name}</span>! Reconstruct game images to earn coins.
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <Coins className="w-6 h-6 text-amber-500" />
                  <span className="text-3xl font-bold text-amber-600">{user.userPoints}</span>
                </div>
                <div className="text-sm text-gray-500">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        {/* Game Stats & Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-cyan-50 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-cyan-600" />
                <span className="text-sm text-gray-600">Time</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatTime(time)}</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Moves</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{moves}</div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-600">Pieces</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{placedPieces}/{gridSize}</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Score</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{score}</div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-gray-600">Hints</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{hintCount - hintsUsed}</div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div className={`mb-4 p-3 rounded-lg text-center font-medium ${
              feedbackMessage.includes("✅") 
                ? "bg-emerald-100 text-emerald-700" 
                : feedbackMessage.includes("❌")
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {feedbackMessage}
            </div>
          )}

          {/* Game Controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={initializeGame}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Restart Puzzle
              </button>

              <button
                onClick={nextPuzzle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Next Game
              </button>

              <button
                onClick={useHint}
                disabled={hintsUsed >= hintCount || gameCompleted}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <HelpCircle className="w-4 h-4" />
                Use Hint ({hintCount - hintsUsed} left)
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition flex items-center gap-2"
              >
                <Grid className="w-4 h-4" />
                {showGrid ? 'Hide' : 'Show'} Grid
              </button>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puzzle Difficulty (Higher difficulty = More coins!)
            </label>
            <div className="flex flex-wrap gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  disabled={gameStarted && !gameCompleted}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    difficulty === level
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${gameStarted && !gameCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <span className="text-xs ml-1 opacity-75">
                    ({difficultySettings[level].rows}×{difficultySettings[level].cols}) - {difficultySettings[level].baseCoins} coins
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Puzzle Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentGame?.name || 'Game Puzzle'}
                </h2>
                {selectedPiece && (
                  <div className="text-sm text-cyan-600 font-medium flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    Piece #{selectedPiece.id + 1} selected
                  </div>
                )}
              </div>

              {/* Puzzle Grid */}
              <div 
                ref={gridRef}
                className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4"
                style={{ minHeight: '500px' }}
              >
                <div className="absolute inset-4 grid gap-1" style={{ 
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
                          className={`border-2 transition-all duration-200 cursor-pointer ${
                            pieceInCell
                              ? pieceInCell.isCorrect
                                ? 'border-emerald-300 bg-emerald-50/50'
                                : 'border-red-300 bg-red-50/50'
                              : 'border-gray-300 hover:border-cyan-400 hover:bg-cyan-50/30'
                          }`}
                        >
                          {pieceInCell && (
                            <div
                              className="w-full h-full bg-cover bg-center rounded relative"
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
                              <div className="absolute top-1 right-1">
                                {pieceInCell.isCorrect ? (
                                  <Check className="w-4 h-4 text-emerald-500 bg-white rounded-full p-0.5" />
                                ) : (
                                  <X className="w-4 h-4 text-red-500 bg-white rounded-full p-0.5" />
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
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="text-center bg-white/90 p-8 rounded-2xl shadow-2xl">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Puzzle Complete!</h3>
                      <p className="text-gray-600 mb-4">
                        You finished in {formatTime(time)} with {moves} moves
                      </p>
                      <div className="inline-flex items-center justify-center bg-amber-100 text-amber-800 text-lg font-bold px-5 py-2 rounded-full mb-3">
                        +{earnedCoins} coins earned!
                      </div>
                      <div className="text-sm text-gray-600 mb-6">
                        Total coins: <span className="font-bold">{user.userPoints}</span>
                      </div>
                      <button
                        onClick={nextPuzzle}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition"
                      >
                        Next Puzzle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {!gameStarted && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-700 text-sm">
                    💡 <strong>How to play:</strong> Click a piece from the side tray, then click on an empty grid cell to place it. Correct pieces stay, wrong pieces disappear. Complete all {gridSize} pieces to win and earn coins!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-8">
            {/* Game Preview */}
            {showPreview && currentGame && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-600" />
                  Original Image
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <img
                    src={currentGame.imageUrl}
                    alt={currentGame.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  This is what you are trying to recreate
                </p>
              </div>
            )}

            {/* Puzzle Pieces Tray */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-gray-600" />
                Puzzle Pieces ({puzzlePieces.filter(p => !p.isPlaced).length} remaining)
              </h3>
              <div className="grid grid-cols-6 gap-2 min-h-[200px]">
                {puzzlePieces
                  .filter(piece => !piece.isPlaced)
                  .map(piece => (
                    <button
                      key={piece.id}
                      onClick={() => handlePieceSelect(piece)}
                      className={`aspect-square rounded-lg transition-all duration-200 hover:scale-110 ${
                        selectedPiece?.id === piece.id
                          ? 'ring-4 ring-cyan-500 ring-offset-2 scale-110 bg-cyan-50'
                          : 'ring-1 ring-gray-200 hover:ring-cyan-300'
                      }`}
                      style={{
                        backgroundImage: `url(${piece.imageUrl})`,
                        backgroundSize: getPieceBackgroundSize(rows, cols),
                        backgroundPosition: getPieceBackgroundPosition(
                          piece.correctRow,
                          piece.correctCol,
                          rows,
                          cols
                        ),
                        cursor: 'pointer'
                      }}
                      title={`Piece ${piece.id + 1}`}
                    />
                  ))}
              </div>
              <p className="text-sm text-gray-500 text-center mt-3">
                Click a piece to select it, then click on the grid to place it
              </p>
            </div>

            {/* Game Info */}
            {currentGame && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Game Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Players</p>
                    <p className="font-medium">{currentGame.players}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{currentGame.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Categories</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentGame.category.slice(0, 3).map((cat, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded"
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
        <footer className="mt-8 text-center text-gray-600">
          <p>
            🧩 Game Jigsaw Puzzle • Using {games.length} games • 
            Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </p>
        </footer>
      </div>
    </div>
  );
}