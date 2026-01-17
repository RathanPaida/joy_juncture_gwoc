"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, X, Circle, Trophy, Gamepad2, Timer, Zap } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./tic-tac-toe-game.css";

interface User {
  _id: string;
  name: string;
}

type Player = 'X' | 'O' | null;
type GameMode = 'easy' | 'medium' | 'hard';

export default function TicTacToeGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [time, setTime] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('medium');
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [aiThinking, setAiThinking] = useState(false);

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
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted]);

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

  // Minimax algorithm for hard difficulty
  const minimax = useCallback((boardState: Player[], depth: number, isMaximizing: boolean): number => {
    const winner = calculateWinner(boardState);
    
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (!boardState.includes(null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'O';
          const score = minimax(boardState, depth + 1, false);
          boardState[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'X';
          const score = minimax(boardState, depth + 1, true);
          boardState[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [calculateWinner]);

  // AI Move based on difficulty
  const makeAIMove = useCallback((currentBoard: Player[]) => {
    setAiThinking(true);
    
    setTimeout(() => {
      const emptyIndices = currentBoard
        .map((cell, index) => cell === null ? index : -1)
        .filter(index => index !== -1);

      if (emptyIndices.length === 0) {
        setAiThinking(false);
        return;
      }

      let moveIndex: number;

      if (gameMode === 'easy') {
        // Easy: Random moves
        moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      } else if (gameMode === 'medium') {
        // Medium: Basic strategy
        const winningMove = findWinningMove(currentBoard, 'O');
        const blockingMove = findWinningMove(currentBoard, 'X');

        if (winningMove !== -1) {
          moveIndex = winningMove;
        } else if (blockingMove !== -1) {
          moveIndex = blockingMove;
        } else if (currentBoard[4] === null) {
          moveIndex = 4;
        } else {
          const corners = [0, 2, 6, 8];
          const availableCorners = corners.filter(index => currentBoard[index] === null);
          if (availableCorners.length > 0) {
            moveIndex = availableCorners[Math.floor(Math.random() * availableCorners.length)];
          } else {
            moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }
        }
      } else {
        // Hard: Minimax algorithm
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
          if (currentBoard[i] === null) {
            currentBoard[i] = 'O';
            const score = minimax(currentBoard, 0, false);
            currentBoard[i] = null;
            
            if (score > bestScore) {
              bestScore = score;
              bestMove = i;
            }
          }
        }
        moveIndex = bestMove;
      }

      const newBoard = [...currentBoard];
      newBoard[moveIndex] = 'O';

      setBoard(newBoard);
      setIsXNext(true);
      setMoves(prev => prev + 1);
      setAiThinking(false);

      const newWinner = calculateWinner(newBoard);
      if (newWinner) {
        setWinner(newWinner);
        setGameCompleted(true);
        setScore(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
        setFeedback(newWinner === 'X' ? '🎉 You Win!' : '🤖 AI Wins!');
      } else if (newBoard.every(cell => cell !== null)) {
        setIsDraw(true);
        setGameCompleted(true);
        setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
        setFeedback('🤝 Draw!');
      }
    }, gameMode === 'hard' ? 1000 : 500); // Longer delay for hard mode to show "thinking"
  }, [gameMode, findWinningMove, minimax, calculateWinner]);

  // AI move trigger
  useEffect(() => {
    if (!isXNext && !winner && !isDraw && gameStarted) {
      makeAIMove(board);
    }
  }, [isXNext, winner, isDraw, gameStarted, board, makeAIMove]);

  // Handle player move
  const handleClick = (index: number) => {
    if (board[index] || winner || isDraw || !isXNext || aiThinking) return;

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
      setFeedback(newWinner === 'X' ? '🎉 You Win!' : '🤖 AI Wins!');
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      setGameCompleted(true);
      setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
      setFeedback('🤝 Draw!');
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
    setFeedback("");
    setAiThinking(false);
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
        className={`ttt-cell ${cell ? `ttt-cell-${cell.toLowerCase()}` : ''} ${!cell && !winner && !isDraw && isXNext && !aiThinking ? 'ttt-cell-hover' : ''}`}
        onClick={() => handleClick(index)}
        disabled={!!cell || winner !== null || isDraw || !isXNext || aiThinking}
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

  return (
    <div className="ttt-game-container">
      <header className="ttt-game-header">
        <div className="ttt-header-content">
          <div>
            <h1 className="ttt-game-title">
              <Zap className="ttt-title-icon" />
              Tic Tac Toe
            </h1>
            <p className="ttt-welcome-message">
              Welcome, <span className="ttt-username">{user?.name}</span>!
            </p>
          </div>
          <div className="ttt-difficulty-selector">
            <select
              value={gameMode}
              onChange={(e) => {
                const newMode = e.target.value as GameMode;
                setGameMode(newMode);
                resetGame();
              }}
              className="ttt-difficulty-select"
              disabled={gameStarted}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </header>

      <div className="ttt-stats-container">
        <div className="ttt-stats-grid">
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
            <div className="ttt-stat-label">Score (X:O:Draws)</div>
            <div className="ttt-stat-value">{score.X} : {score.O} : {score.draws}</div>
          </div>

          <div className="ttt-stat-card">
            <Trophy className="ttt-stat-icon" />
            <div className="ttt-stat-label">Difficulty</div>
            <div className="ttt-stat-value">{gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}</div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`ttt-feedback-message ${feedback.includes('🎉') ? 'success' : feedback.includes('🤖') ? 'error' : 'draw'}`}>
          {feedback}
        </div>
      )}

      {/* AI Thinking Indicator */}
      {aiThinking && (
        <div className="ttt-ai-thinking">
          <div className="ttt-ai-spinner"></div>
          <span>🤖 AI is thinking...</span>
        </div>
      )}

      {/* Current Player */}
      <div className="ttt-current-player">
        <div className={`ttt-player-indicator ${isXNext ? 'ttt-player-x' : 'ttt-player-o'}`}>
          {isXNext ? (
            <>
              <X className="ttt-player-icon" />
              <span>Your Turn (X)</span>
            </>
          ) : (
            <>
              <Circle className="ttt-player-icon" />
              <span>AI's Turn (O)</span>
            </>
          )}
        </div>
      </div>

      {/* Game Board */}
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

      {/* Controls */}
      <div className="ttt-controls">
        <button onClick={resetGame} className="ttt-button ttt-button-restart">
          <RefreshCw className="ttt-button-icon" />
          New Game
        </button>
        <button
          onClick={() => router.push("/zone")}
          className="ttt-button ttt-button-secondary"
        >
          <Gamepad2 className="ttt-button-icon" />
          Game Zone
        </button>
      </div>

      {/* Game Completed Overlay */}
      {gameCompleted && (
        <div className="ttt-game-overlay">
          <div className="ttt-game-over-card">
            <div className="ttt-result-emoji">
              {feedback.includes('🎉') ? '🎉' : feedback.includes('🤖') ? '🤖' : '🤝'}
            </div>
            <h3 className="ttt-result-title">{feedback}</h3>
            <div className="ttt-result-stats">
              <p>Time: {formatTime(time)}</p>
              <p>Moves: {moves}</p>
              <p>Difficulty: {gameMode}</p>
            </div>
            <div className="ttt-result-actions">
              <button onClick={resetGame} className="ttt-button ttt-button-primary">
                Play Again
              </button>
              <button
                onClick={() => setGameCompleted(false)}
                className="ttt-button ttt-button-secondary"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!gameStarted && (
        <div className="ttt-instructions">
          <h3 className="ttt-instructions-title">How to Play</h3>
          <div className="ttt-instructions-content">
            <p>• You play as <strong>X</strong>, AI plays as <strong>O</strong></p>
            <p>• Get three in a row to win</p>
            <p>• Choose difficulty: 
              <span className="ttt-diff-easy">Easy</span> (random moves), 
              <span className="ttt-diff-medium">Medium</span> (basic strategy), 
              <span className="ttt-diff-hard">Hard</span> (unbeatable)
            </p>
            <p>• No time limits - play at your own pace!</p>
          </div>
        </div>
      )}
    </div>
  );
}