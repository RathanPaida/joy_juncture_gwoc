"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Gamepad2, Coins, Trophy, RefreshCw,
  Zap, Lock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Clock, TrendingUp, AlertCircle
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./snake-game.css";

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

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'playing' | 'paused' | 'game-over' | 'not-started';

const SNAKE_GAME_ID = "snake";
const SNAKE_GAME_NAME = "Snake Challenge";
const BASE_COINS = 5;
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  // Game state
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameStatus, setGameStatus] = useState<GameStatus>('not-started');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [time, setTime] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Refs
  const directionRef = useRef<Direction>('RIGHT');
  const gameStatusRef = useRef<GameStatus>('not-started');
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 5, y: 5 });

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
            const playedToday = hasPlayedToday(data.user, SNAKE_GAME_ID);
            setCanPlay(!playedToday);

            if (playedToday) {
              setNextPlayTime(getNextPlayTime(data.user, SNAKE_GAME_ID));
              setGameMessage("🚫 You have already played Snake today!");
            }

            // Load high score from localStorage
            const savedHighScore = localStorage.getItem('snakeHighScore');
            if (savedHighScore) {
              setHighScore(parseInt(savedHighScore));
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

  // Update refs when state changes
  useEffect(() => {
    directionRef.current = direction;
    gameStatusRef.current = gameStatus;
    snakeRef.current = snake;
    foodRef.current = food;
  }, [direction, gameStatus, snake, food]);

  // Generate random food
  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snakeRef.current.some(segment =>
      segment.x === newFood.x && segment.y === newFood.y
    ));

    setFood(newFood);
    foodRef.current = newFood;
  }, []);

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Main game loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const gameLoop = setInterval(() => {
      moveSnake();
    }, speed);

    return () => clearInterval(gameLoop);
  }, [gameStatus, speed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatusRef.current !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') {
            setDirection('UP');
            directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
          if (directionRef.current !== 'UP') {
            setDirection('DOWN');
            directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT') {
            setDirection('LEFT');
            directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT') {
            setDirection('RIGHT');
            directionRef.current = 'RIGHT';
          }
          break;
        case ' ':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Move snake
  const moveSnake = () => {
    if (gameStatusRef.current !== 'playing') return;

    const head = { ...snakeRef.current[0] };

    // Update head position based on direction
    switch (directionRef.current) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    // Check wall collision
    if (
      head.x < 0 || head.x >= GRID_SIZE ||
      head.y < 0 || head.y >= GRID_SIZE
    ) {
      endGame();
      return;
    }

    // Check self collision
    if (snakeRef.current.some((segment, index) =>
      index > 0 && segment.x === head.x && segment.y === head.y
    )) {
      endGame();
      return;
    }

    const newSnake = [head, ...snakeRef.current];

    // Check food collision
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      // Increase score
      const newScore = score + 10;
      setScore(newScore);

      // Update high score if needed
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('snakeHighScore', newScore.toString());
      }

      // Increase speed every 50 points
      if (newScore % 50 === 0 && speed > 50) {
        setSpeed(prev => Math.max(50, prev - 20));
      }

      // Generate new food
      generateFood();
    } else {
      // Remove tail if no food eaten
      newSnake.pop();
    }

    setSnake(newSnake);
    snakeRef.current = newSnake;
  };

  // Start game
  const startGame = () => {
    if (!canPlay) return;

    resetGame();
    setGameStatus('playing');
    setGameStatusRef('playing');
    setGameMessage("");
  };

  // Pause game
  const togglePause = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      setGameStatusRef('paused');
      setGameMessage("⏸️ Game Paused");
    } else if (gameStatus === 'paused') {
      setGameStatus('playing');
      setGameStatusRef('playing');
      setGameMessage("");
    }
  };

  // Set game status ref
  const setGameStatusRef = (status: GameStatus) => {
    gameStatusRef.current = status;
  };

  // End game
  const endGame = async () => {
    setGameStatus('game-over');
    setGameStatusRef('game-over');

    // Calculate coins
    const coins = calculateCoins();
    setEarnedCoins(coins);

    if (!user) {
      setGameMessage(`🎮 Game Over! Score: ${score}. Login to save your score.`);
      return;
    }

    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) {
        setGameMessage(`🎮 Game Over! Score: ${score}. Earned ${coins} coins!`);
        return;
      }

      const response = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: SNAKE_GAME_ID,
          gameName: SNAKE_GAME_NAME,
          score: score,
          pointsEarned: coins
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local user state immediately with new game record
        const newGameRecord = {
          gameId: SNAKE_GAME_ID,
          gameName: SNAKE_GAME_NAME,
          playedAt: new Date(),
          score: score,
          pointsEarned: coins,
          completed: true
        };

        const updatedUser = user ? {
          ...user,
          userPoints: data.userPoints || user.userPoints,
          gamesPlayed: [...(user.gamesPlayed || []), newGameRecord]
        } : null;

        if (updatedUser) {
          setUser(updatedUser);
          setNextPlayTime(getNextPlayTime(updatedUser, SNAKE_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(`🎮 Game Over! Score: ${score}. Earned ${coins} coins!`);
      } else {
        setCanPlay(false);
        setGameMessage(`🎮 Game Over! Score: ${score}. Earned ${coins} coins!`);
      }
    } catch (error) {
      console.error("Error saving game:", error);
      setGameMessage(`🎮 Game Over! Score: ${score}. Earned ${coins} coins!`);
    }
  };

  // Calculate coins
  const calculateCoins = (): number => {
    let coins = BASE_COINS;

    // Score bonus
    const scoreBonus = Math.floor(score / 10);

    // Time bonus (longer survival is better)
    const timeBonus = Math.floor(time / 10);

    // Speed bonus (higher speed = more skill)
    const speedBonus = Math.floor((INITIAL_SPEED - speed) / 10);

    coins = coins + scoreBonus + timeBonus + speedBonus;

    return Math.max(10, coins);
  };

  // Reset game
  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;

    const initialFood = { x: 5, y: 5 };
    setFood(initialFood);
    foodRef.current = initialFood;

    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setTime(0);
    setEarnedCoins(0);
    setGameMessage("");
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render grid cell
  const renderCell = (row: number, col: number) => {
    const isSnakeHead = snake[0].x === col && snake[0].y === row;
    const isSnakeBody = snake.some((segment, index) =>
      index > 0 && segment.x === col && segment.y === row
    );
    const isFood = food.x === col && food.y === row;

    let className = "snake-grid-cell";

    if (isSnakeHead) {
      className += " snake-head";
    } else if (isSnakeBody) {
      className += " snake-body";
    } else if (isFood) {
      className += " snake-food";
    }

    return <div key={`${row}-${col}`} className={className} />;
  };

  if (authLoading || loading) {
    return (
      <div className="snake-loading-screen">
        <div className="snake-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!canPlay && gameStatus === 'not-started') {
    return (
      <div className="snake-game-container">
        <header className="snake-game-header">
          <div className="snake-header-card">
            <div className="snake-header-content">
              <div>
                <h1 className="snake-game-title">
                  <Gamepad2 className="snake-title-icon" />
                  Snake Challenge
                </h1>
                <p className="snake-welcome-message">
                  Welcome, <span className="snake-username">{user?.name}</span>!
                </p>
              </div>
              <div className="snake-user-coins">
                <div className="snake-coins-display">
                  <Coins className="snake-coins-icon" />
                  <span className="snake-coins-value">{user?.userPoints || 0}</span>
                </div>
                <div className="snake-coins-label">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        <div className="snake-already-played">
          <div className="snake-locked-card">
            <Lock className="snake-lock-icon" />
            <h2 className="snake-locked-title">Game Already Played Today</h2>
            <p className="snake-locked-message">
              {gameMessage || "🚫 You have already played Snake today!"}
            </p>
            <div className="snake-next-play">
              <div className="snake-next-play-label">Next available in:</div>
              <div className="snake-next-play-time">{nextPlayTime || "Calculating..."}</div>
            </div>
            <p className="snake-locked-hint">
              Come back tomorrow for another challenge!
            </p>
            <button
              onClick={() => router.push("/zone")}
              className="snake-button snake-button-primary"
            >
              <Gamepad2 className="snake-button-icon" />
              Return to Game Zone
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="snake-game-container">
      <header className="snake-game-header">
        <div className="snake-header-card">
          <div className="snake-header-content">
            <div>
              <h1 className="snake-game-title">
                <Gamepad2 className="snake-title-icon" />
                Snake Challenge
              </h1>
              <p className="snake-welcome-message">
                Welcome, <span className="snake-username">{user?.name}</span>!
                {canPlay ? " Eat food, avoid walls and yourself!" : " Game already played today."}
              </p>
            </div>
            <div className="snake-user-coins">
              <div className="snake-coins-display">
                <Coins className="snake-coins-icon" />
                <span className="snake-coins-value">{user?.userPoints || 0}</span>
              </div>
              <div className="snake-coins-label">Total Coins</div>
            </div>
          </div>
        </div>
      </header>

      <div className="snake-stats-container">
        <div className="snake-stats-grid">
          <div className="snake-stat-card">
            <div className="snake-stat-header">
              <Zap className="snake-stat-icon" />
              <span className="snake-stat-label">Score</span>
            </div>
            <div className="snake-stat-value">{score}</div>
          </div>

          <div className="snake-stat-card">
            <div className="snake-stat-header">
              <Trophy className="snake-stat-icon" />
              <span className="snake-stat-label">High Score</span>
            </div>
            <div className="snake-stat-value">{highScore}</div>
          </div>

          <div className="snake-stat-card">
            <div className="snake-stat-header">
              <Clock className="snake-stat-icon" />
              <span className="snake-stat-label">Time</span>
            </div>
            <div className="snake-stat-value">{formatTime(time)}</div>
          </div>

          <div className="snake-stat-card">
            <div className="snake-stat-header">
              <TrendingUp className="snake-stat-icon" />
              <span className="snake-stat-label">Speed</span>
            </div>
            <div className="snake-stat-value">{INITIAL_SPEED - speed + 50}%</div>
          </div>
        </div>

        {gameMessage && (
          <div className={`snake-feedback-message ${gameMessage.includes('🎮') ? 'info' :
            gameMessage.includes('⏸️') ? 'warning' :
              gameMessage.includes('🚫') ? 'error' : 'success'
            }`}>
            {gameMessage}
          </div>
        )}
      </div>

      <div className="snake-game-area">
        <div className="snake-game-section">
          <div className="snake-game-card">
            <div className="snake-grid">
              {Array.from({ length: GRID_SIZE }).map((_, row) => (
                <div key={row} className="snake-grid-row">
                  {Array.from({ length: GRID_SIZE }).map((_, col) =>
                    renderCell(row, col)
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="snake-controls-section">
          <div className="snake-controls-card">
            <h3 className="snake-controls-title">
              <Gamepad2 className="snake-controls-icon" />
              Game Controls
            </h3>

            <div className="snake-action-buttons">
              {gameStatus === 'not-started' ? (
                <button
                  onClick={startGame}
                  disabled={!canPlay}
                  className="snake-button snake-button-primary"
                >
                  <Zap className="snake-button-icon" />
                  Start Game
                </button>
              ) : gameStatus === 'playing' ? (
                <button
                  onClick={togglePause}
                  className="snake-button snake-button-warning"
                >
                  ⏸️ Pause Game
                </button>
              ) : gameStatus === 'paused' ? (
                <button
                  onClick={togglePause}
                  className="snake-button snake-button-success"
                >
                  ▶️ Resume Game
                </button>
              ) : (
                <button
                  onClick={startGame}
                  disabled={!canPlay}
                  className="snake-button snake-button-primary"
                >
                  <RefreshCw className="snake-button-icon" />
                  Play Again
                </button>
              )}

              <button
                onClick={resetGame}
                className="snake-button snake-button-secondary"
              >
                <RefreshCw className="snake-button-icon" />
                Reset Game
              </button>
            </div>

            <div className="snake-control-instructions">
              <h4>How to Play:</h4>
              <ul>
                <li>Use <strong>Arrow Keys</strong> to control the snake</li>
                <li>Eat <span className="food-sample">●</span> to grow and score points</li>
                <li>Avoid walls and yourself</li>
                <li>Speed increases every 50 points</li>
                <li>Press <strong>SPACE</strong> to pause/resume</li>
              </ul>
            </div>

            <div className="snake-control-buttons">
              <div className="snake-direction-controls">
                <div className="snake-direction-row">
                  <button
                    onClick={() => {
                      if (direction !== 'DOWN') {
                        setDirection('UP');
                        directionRef.current = 'UP';
                      }
                    }}
                    disabled={gameStatus !== 'playing'}
                    className="snake-direction-button up"
                  >
                    <ArrowUp />
                  </button>
                </div>
                <div className="snake-direction-row">
                  <button
                    onClick={() => {
                      if (direction !== 'RIGHT') {
                        setDirection('LEFT');
                        directionRef.current = 'LEFT';
                      }
                    }}
                    disabled={gameStatus !== 'playing'}
                    className="snake-direction-button left"
                  >
                    <ArrowLeft />
                  </button>
                  <div className="snake-direction-center"></div>
                  <button
                    onClick={() => {
                      if (direction !== 'LEFT') {
                        setDirection('RIGHT');
                        directionRef.current = 'RIGHT';
                      }
                    }}
                    disabled={gameStatus !== 'playing'}
                    className="snake-direction-button right"
                  >
                    <ArrowRight />
                  </button>
                </div>
                <div className="snake-direction-row">
                  <button
                    onClick={() => {
                      if (direction !== 'UP') {
                        setDirection('DOWN');
                        directionRef.current = 'DOWN';
                      }
                    }}
                    disabled={gameStatus !== 'playing'}
                    className="snake-direction-button down"
                  >
                    <ArrowDown />
                  </button>
                </div>
              </div>
            </div>

            <div className="snake-game-info">
              <h4>Game Info:</h4>
              <div className="snake-info-grid">
                <div className="snake-info-item">
                  <span className="snake-info-label">Grid Size</span>
                  <span className="snake-info-value">{GRID_SIZE}×{GRID_SIZE}</span>
                </div>
                <div className="snake-info-item">
                  <span className="snake-info-label">Base Coins</span>
                  <span className="snake-info-value">{BASE_COINS}</span>
                </div>
                <div className="snake-info-item">
                  <span className="snake-info-label">Food Value</span>
                  <span className="snake-info-value">10 points</span>
                </div>
                <div className="snake-info-item">
                  <span className="snake-info-label">Speed Bonus</span>
                  <span className="snake-info-value">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {gameStatus === 'game-over' && (
        <div className="snake-game-overlay">
          <div className="snake-game-over-card">
            <div className="snake-game-over-emoji">🎮</div>
            <h3 className="snake-game-over-title">Game Over!</h3>
            <div className="snake-game-over-stats">
              <div className="snake-stat-result">
                <span className="snake-stat-label">Final Score:</span>
                <span className="snake-stat-value">{score}</span>
              </div>
              <div className="snake-stat-result">
                <span className="snake-stat-label">Time Survived:</span>
                <span className="snake-stat-value">{formatTime(time)}</span>
              </div>
              <div className="snake-stat-result">
                <span className="snake-stat-label">High Score:</span>
                <span className="snake-stat-value">{highScore}</span>
              </div>
              {earnedCoins > 0 && (
                <div className="snake-stat-result coins-earned">
                  <span className="snake-stat-label">Coins Earned:</span>
                  <span className="snake-stat-value">+{earnedCoins}</span>
                </div>
              )}
            </div>

            {gameMessage && (
              <div className="snake-game-over-message">
                {gameMessage}
              </div>
            )}

            <div className="snake-game-over-buttons">
              <button
                onClick={startGame}
                disabled={!canPlay}
                className="snake-button snake-button-primary"
              >
                <RefreshCw className="snake-button-icon" />
                Play Again
              </button>
              <button
                onClick={() => router.push("/zone")}
                className="snake-button snake-button-secondary"
              >
                <Gamepad2 className="snake-button-icon" />
                Return to Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}