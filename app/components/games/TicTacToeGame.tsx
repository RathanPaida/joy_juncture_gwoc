"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, X, Circle, Trophy, Coins, Lock, Gamepad2, Timer } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./tic-tac-toe-game.css";

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

type Player = 'X' | 'O' | null;
type GameMode = 'easy' | 'medium' | 'hard';

const TICTACTOE_GAME_ID = "tictactoe";
const TICTACTOE_GAME_NAME = "Tic Tac Toe Challenge";
const BASE_COINS = 5;

export default function TicTacToeGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [time, setTime] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('medium');
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [moves, setMoves] = useState(0);

  // Check if user has already played a game TODAY (using UTC)
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

  // Authentication and user data
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }

    const initUser = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            const playedToday = hasPlayedToday(data.user, TICTACTOE_GAME_ID);
            setCanPlay(!playedToday);

            if (playedToday) {
              setNextPlayTime(getNextPlayTime(data.user, TICTACTOE_GAME_ID));
              setGameMessage("🚫 You have already played Tic Tac Toe today!");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, [authUser, authLoading, router]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameCompleted && canPlay) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted, canPlay]);

  // Calculate winner
  const calculateWinner = useCallback((boardState: Player[]): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return boardState[a];
      }
    }
    return null;
  }, []);

  // Find winning move for a player
  const findWinningMove = useCallback((boardState: Player[], player: Player): number => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (boardState[a] === player && boardState[b] === player && boardState[c] === null) return c;
      if (boardState[a] === player && boardState[c] === player && boardState[b] === null) return b;
      if (boardState[b] === player && boardState[c] === player && boardState[a] === null) return a;
    }
    return -1;
  }, []);

  // Calculate coins
  const calculateCoins = useCallback((result: 'win' | 'lose' | 'draw'): number => {
    if (result === 'lose') return 10;

    let coins = BASE_COINS;

    const timeBonus = Math.max(0, Math.floor((60 - time) / 5));
    const movesBonus = Math.max(0, 15 - moves);
    const difficultyMultiplier = gameMode === 'easy' ? 1 : gameMode === 'medium' ? 1.5 : 2;

    if (result === 'win') {
      coins = Math.floor((coins + timeBonus + movesBonus) * difficultyMultiplier);
    } else {
      coins = Math.floor((coins / 2 + timeBonus + movesBonus) * difficultyMultiplier * 0.5);
    }

    return Math.max(10, coins);
  }, [time, moves, gameMode]);

  // Finish game
  const finishGame = useCallback(async (result: 'win' | 'lose' | 'draw') => {
    const coins = calculateCoins(result);
    setEarnedCoins(coins);

    if (!user) return;

    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) return;

      const scoreValue = result === 'win' ? 100 : result === 'draw' ? 50 : 0;

      const response = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: TICTACTOE_GAME_ID,
          gameName: TICTACTOE_GAME_NAME,
          score: scoreValue,
          pointsEarned: coins
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Determine if the game was a win or draw
        const isWin = result === 'win';
        const isDraw = result === 'draw';

        // Update local user state immediately with new game record
        const newGameRecord = {
          gameId: TICTACTOE_GAME_ID,
          gameName: TICTACTOE_GAME_NAME,
          playedAt: new Date(),
          score: scoreValue,
          pointsEarned: coins,
          completed: true
        };

        const updatedUser = user ? {
          ...user,
          userPoints: data.totalPoints || user.userPoints, // Use data.totalPoints from API response
          gamesPlayed: [...(user.gamesPlayed || []), newGameRecord]
        } : null;

        if (updatedUser) {
          setUser(updatedUser);
          setNextPlayTime(getNextPlayTime(updatedUser, TICTACTOE_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(
          isWin
            ? `🎉 Congratulations! You won and earned ${coins} coins! Come back tomorrow to play again.`
            : isDraw
              ? `🤝 Draw! You earned ${coins} coins. Come back tomorrow!`
              : `😢 You lost! You earned ${coins} coins. Come back tomorrow!`
        );
      }
    } catch (error) {
      console.error("Error saving game:", error);
    }
  }, [calculateCoins, user]);

  // AI Move - optimized with immediate execution
  const makeAIMove = useCallback((currentBoard: Player[]) => {
    const emptyIndices = currentBoard
      .map((cell, index) => cell === null ? index : -1)
      .filter(index => index !== -1);

    if (emptyIndices.length === 0) return;

    let moveIndex: number;

    // Try to win
    const winningMove = findWinningMove(currentBoard, 'O');
    if (winningMove !== -1) {
      moveIndex = winningMove;
    }
    // Block player
    else {
      const blockingMove = findWinningMove(currentBoard, 'X');
      if (blockingMove !== -1) {
        moveIndex = blockingMove;
      }
      // Take center
      else if (currentBoard[4] === null) {
        moveIndex = 4;
      }
      // Take corners
      else {
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => currentBoard[index] === null);
        if (availableCorners.length > 0) {
          moveIndex = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        // Random move
        else {
          moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
      }
    }

    const newBoard = [...currentBoard];
    newBoard[moveIndex] = 'O';

    setBoard(newBoard);
    setIsXNext(true);
    setMoves(prev => prev + 1);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setGameCompleted(true);
      setScore(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
      finishGame(newWinner === 'X' ? 'win' : 'lose');
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      setGameCompleted(true);
      finishGame('draw');
    }
  }, [findWinningMove, calculateWinner, finishGame]);

  // AI move trigger - simplified with minimal delay
  useEffect(() => {
    if (!isXNext && !winner && !isDraw && canPlay && gameStarted) {
      const timer = setTimeout(() => {
        makeAIMove(board);
      }, 200); // Reduced to 200ms for faster response

      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, isDraw, canPlay, gameStarted, board, makeAIMove]);

  // Handle player move
  const handleClick = (index: number) => {
    if (board[index] || winner || isDraw || !isXNext || !canPlay) return;

    if (!gameStarted) setGameStarted(true);

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    setMoves(prev => prev + 1);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setGameCompleted(true);
      setScore(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
      finishGame(newWinner === 'X' ? 'win' : 'lose');
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      setGameCompleted(true);
      finishGame('draw');
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsDraw(false);
    setIsXNext(true);
    setGameStarted(false);
    setGameCompleted(false);
    setTime(0);
    setMoves(0);
    setEarnedCoins(0);
    setGameMessage("");
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render cell
  const renderCell = (index: number) => {
    const cell = board[index];
    return (
      <button
        className={`ttt-cell ${cell ? `ttt-cell-${cell.toLowerCase()}` : ''}`}
        onClick={() => handleClick(index)}
        disabled={!!cell || winner !== null || isDraw || !isXNext || !canPlay}
      >
        {cell === 'X' && <X className="ttt-x" />}
        {cell === 'O' && <Circle className="ttt-o" />}
      </button>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="ttt-loading-screen">
        <div className="ttt-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!canPlay && !gameStarted) {
    return (
      <div className="ttt-game-container">
        <header className="ttt-game-header">
          <h1 className="ttt-game-title">
            <Trophy className="ttt-title-icon" />
            Tic Tac Toe Challenge
          </h1>
          <p className="ttt-welcome-message">
            Welcome, <span className="ttt-username">{user?.name}</span>!
          </p>
        </header>

        <div className="ttt-already-played">
          <Lock className="ttt-lock-icon" />
          <h2>Game Already Played Today</h2>
          <p>{gameMessage || "🚫 You have already played Tic Tac Toe today!"}</p>
          <div className="ttt-next-play">
            Next available in: <span className="ttt-next-play-time">{nextPlayTime}</span>
          </div>
          <button
            onClick={() => router.push("/zone")}
            className="ttt-button ttt-button-primary"
          >
            <Gamepad2 className="ttt-button-icon" />
            Return to Game Zone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ttt-game-container">
      <header className="ttt-game-header">
        <div className="ttt-header-content">
          <div>
            <h1 className="ttt-game-title">
              <Trophy className="ttt-title-icon" />
              Tic Tac Toe Challenge
            </h1>
            <p className="ttt-welcome-message">
              Welcome, <span className="ttt-username">{user?.name}</span>!
            </p>
          </div>
          <div className="ttt-user-coins">
            <Coins className="ttt-coins-icon" />
            <span className="ttt-coins-value">{user?.userPoints || 0}</span>
          </div>
        </div>
      </header>

      <div className="ttt-stats-container">
        <div className="ttt-stat-card">
          <Timer className="ttt-stat-icon" />
          <div className="ttt-stat-label">Time</div>
          <div className="ttt-stat-value">{formatTime(time)}</div>
        </div>

        <div className="ttt-stat-card">
          <div className="ttt-stat-label">Moves</div>
          <div className="ttt-stat-value">{moves}</div>
        </div>

        <div className="ttt-stat-card">
          <div className="ttt-stat-label">Score</div>
          <div className="ttt-stat-value">X: {score.X} | O: {score.O}</div>
        </div>
      </div>

      <div className="ttt-game-info">
        <div className="ttt-mode-selector">
          <label>Difficulty:</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode)}
            disabled={gameStarted}
            className="ttt-mode-select"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="ttt-current-player">
          Current Player:
          <span className={`ttt-player-indicator ${isXNext ? 'ttt-player-x' : 'ttt-player-o'}`}>
            {isXNext ? 'X (You)' : 'O (Computer)'}
          </span>
        </div>

        {!isXNext && !winner && !isDraw && gameStarted && (
          <div className="ttt-ai-thinking">
            🤖 AI is thinking...
          </div>
        )}
      </div>

      <div className="ttt-board-container">
        <div className="ttt-board">
          <div className="ttt-row">
            {renderCell(0)}
            {renderCell(1)}
            {renderCell(2)}
          </div>
          <div className="ttt-row">
            {renderCell(3)}
            {renderCell(4)}
            {renderCell(5)}
          </div>
          <div className="ttt-row">
            {renderCell(6)}
            {renderCell(7)}
            {renderCell(8)}
          </div>
        </div>
      </div>

      <div className="ttt-controls">
        <button onClick={resetGame} className="ttt-button ttt-button-restart">
          <RefreshCw className="ttt-button-icon" />
          Restart Game
        </button>
      </div>

      {gameMessage && (
        <div className="ttt-message">
          <div className={`ttt-message-card ${gameMessage.includes('🎉') ? 'success' : gameMessage.includes('🤝') ? 'draw' : 'info'}`}>
            {gameMessage}
          </div>
        </div>
      )}

      {gameCompleted && (
        <div className="ttt-game-over">
          <div className="ttt-game-over-card">
            <h3>{winner === 'X' ? '🎉 You Win!' : winner === 'O' ? '😢 You Lose!' : '🤝 Draw!'}</h3>
            <p>Time: {formatTime(time)} • Moves: {moves}</p>
            <div className="ttt-coins-earned">+{earnedCoins} coins earned!</div>
            <div className="ttt-total-coins">
              Total coins: <span>{user?.userPoints || 0}</span>
            </div>
            <button
              onClick={() => router.push("/zone")}
              className="ttt-button ttt-button-primary"
            >
              Return to Game Zone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}