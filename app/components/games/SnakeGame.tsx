"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Gamepad2, Trophy, RefreshCw,
  Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Clock, Gauge, Crown
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./snake-game.css";

interface User {
  _id: string;
  name: string;
  snakeHighScores?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'playing' | 'paused' | 'game-over' | 'not-started';
type Difficulty = 'easy' | 'medium' | 'hard';

const GRID_SIZE = 20;

export default function SnakeGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Game state
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameStatus, setGameStatus] = useState<GameStatus>('not-started');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [time, setTime] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [speed, setSpeed] = useState(150);
  const [gameMode, setGameMode] = useState<'classic' | 'walls'>('classic');
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState<string>(''); // NEW: Track data freshness

  // Refs
  const directionRef = useRef<Direction>('RIGHT');
  const gameStatusRef = useRef<GameStatus>('not-started');
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const isNewHighScoreRef = useRef(false);

  // Get token helper
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

  // FIXED: Fetch user data with cache busting
  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      const token = await getIdToken();
      if (!token) return null;

      console.log("🔄 Fetching user data...");

      // Add cache busting to prevent stale data
      const url = forceRefresh
        ? `/api/user/me?t=${Date.now()}`
        : '/api/user/me';

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          console.log("✅ User data received:", {
            name: data.user.name,
            scores: data.user.snakeHighScores,
            timestamp: data.timestamp || 'no timestamp'
          });

          setUser(data.user);

          // Update high score for current difficulty
          if (data.user.snakeHighScores) {
            const scoreForDifficulty = data.user.snakeHighScores[difficulty] || 0;
            setHighScore(scoreForDifficulty);
            highScoreRef.current = scoreForDifficulty;
            setIsNewHighScore(false);
            isNewHighScoreRef.current = false;
          } else {
            setHighScore(0);
            highScoreRef.current = 0;
          }

          setDataTimestamp(data.timestamp || new Date().toISOString());
          return data.user;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }, [difficulty]);

  // Authentication and user data
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }

    const initUser = async () => {
      await fetchUserData(true); // Force refresh on initial load
      setLoading(false);
    };

    initUser();
  }, [authUser, authLoading, router, fetchUserData]);

  // Update high score when difficulty changes
  useEffect(() => {
    if (user?.snakeHighScores) {
      const scoreForDifficulty = user.snakeHighScores[difficulty] || 0;
      console.log(`🔄 Difficulty changed to ${difficulty}: high score = ${scoreForDifficulty}`);
      setHighScore(scoreForDifficulty);
      highScoreRef.current = scoreForDifficulty;
      setIsNewHighScore(false);
      isNewHighScoreRef.current = false;
    }
  }, [difficulty, user]);

  // Update refs when state changes
  useEffect(() => {
    directionRef.current = direction;
    gameStatusRef.current = gameStatus;
    snakeRef.current = snake;
    foodRef.current = food;
    scoreRef.current = score;
    highScoreRef.current = highScore;
    isNewHighScoreRef.current = isNewHighScore;
  }, [direction, gameStatus, snake, food, score, highScore, isNewHighScore]);

  // Set speed based on difficulty
  useEffect(() => {
    switch (difficulty) {
      case 'easy':
        setSpeed(200);
        break;
      case 'medium':
        setSpeed(150);
        break;
      case 'hard':
        setSpeed(100);
        break;
    }
  }, [difficulty]);

  // Generate random food
  const generateFood = useCallback(() => {
    let newFood;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      attempts++;

      if (attempts > maxAttempts) {
        newFood = { x: 5, y: 5 };
        break;
      }
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
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') {
            setDirection('UP');
            directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') {
            setDirection('DOWN');
            directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') {
            setDirection('LEFT');
            directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') {
            setDirection('RIGHT');
            directionRef.current = 'RIGHT';
          }
          break;
        case ' ':
        case 'Escape':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // FIXED: Save high score to backend with proper refresh
  const saveHighScore = async (score: number) => {
    try {
      const token = await getIdToken();
      if (!token || !user) return false;

      console.log(`📤 Saving high score: ${score} for ${difficulty}`);

      const response = await fetch("/api/user/snake-high-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          difficulty: difficulty,
          score: score
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // IMPORTANT: Force refresh user data after save to ensure sync
        await fetchUserData(true);

        return true;
      } else {
        console.error("❌ Failed to save high score:", data.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error saving high score:", error);
      return false;
    }
  };

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

    // Check wall collision (if walls mode is enabled)
    if (gameMode === 'walls') {
      if (
        head.x < 0 || head.x >= GRID_SIZE ||
        head.y < 0 || head.y >= GRID_SIZE
      ) {
        endGame();
        return;
      }
    } else {
      // Classic mode: wrap around edges
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;
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
      // Calculate points based on difficulty
      let points = 10;
      if (difficulty === 'medium') points = 15;
      if (difficulty === 'hard') points = 20;

      const newScoreValue = scoreRef.current + points;

      console.log(`🍎 Food eaten! +${points} points. Score: ${scoreRef.current} → ${newScoreValue}`);

      // Update score
      setScore(newScoreValue);
      scoreRef.current = newScoreValue;

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
    resetGame();
    setGameStatus('playing');
    gameStatusRef.current = 'playing';
  };

  // Pause game
  const togglePause = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      gameStatusRef.current = 'paused';
    } else if (gameStatus === 'paused') {
      setGameStatus('playing');
      gameStatusRef.current = 'playing';
    }
  };

  // FIXED: End game with immediate UI update
  const endGame = async () => {
    console.log("🎮 Game ending...");
    setGameStatus('game-over');
    gameStatusRef.current = 'game-over';

    // Get current values from refs
    const finalScore = scoreRef.current;
    const currentHighScore = highScoreRef.current;

    console.log(`📊 Final Score: ${finalScore}, Current High Score: ${currentHighScore}`);

    // Check if this is a new high score
    if (finalScore > currentHighScore) {
      console.log(`🏆 NEW HIGH SCORE DETECTED! ${currentHighScore} → ${finalScore}`);

      // IMMEDIATELY update UI for better UX
      setHighScore(finalScore);
      highScoreRef.current = finalScore;
      setIsNewHighScore(true);
      isNewHighScoreRef.current = true;

      // Save to database
      const saved = await saveHighScore(finalScore);
      if (saved) {
        console.log("🎉 New high score saved and UI updated!");
      } else {
        console.error("❌ Failed to save high score to database");
      }
    } else {
      console.log(`ℹ️ Score ${finalScore} not higher than high score ${currentHighScore}`);
      setIsNewHighScore(false);
      isNewHighScoreRef.current = false;
    }
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
    scoreRef.current = 0;
    setTime(0);
    setIsNewHighScore(false);
    isNewHighScoreRef.current = false;
    generateFood();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get speed percentage
  const getSpeedPercentage = () => {
    switch (difficulty) {
      case 'easy': return '50%';
      case 'medium': return '75%';
      case 'hard': return '100%';
      default: return '75%';
    }
  };

  // Get all high scores
  const getAllHighScores = () => {
    if (!user?.snakeHighScores) {
      return { easy: 0, medium: 0, hard: 0 };
    }
    return user.snakeHighScores;
  };

  // Render grid cell
  const renderCell = (row: number, col: number) => {
    const isSnakeHead = snake[0].x === col && snake[0].y === row;
    const isSnakeBody = snake.some((segment, index) =>
      index > 0 && segment.x === col && segment.y === row
    );
    const isFood = food.x === col && food.y === row;
    const isWall = gameMode === 'walls' && (
      row === 0 || row === GRID_SIZE - 1 ||
      col === 0 || col === GRID_SIZE - 1
    );

    let className = "snake-grid-cell";

    if (isSnakeHead) {
      className += " snake-head";
    } else if (isSnakeBody) {
      className += " snake-body";
    } else if (isFood) {
      className += " snake-food";
    } else if (isWall) {
      className += " snake-wall";
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

  const allHighScores = getAllHighScores();

  return (
    <div className="snake-game-container">
      <header className="snake-game-header">
        <div className="snake-header-card">
          <div className="snake-header-content">
            <div>
              <h1 className="snake-game-title">
                <Gamepad2 className="snake-title-icon" />
                Snake Game
              </h1>
              <p className="snake-welcome-message">
                Welcome, <span className="snake-username">{user?.name}</span>!
                Eat food, grow your snake, and avoid collisions!
              </p>
            </div>
            <div className="snake-game-settings">
              <div className="snake-setting-group">
                <label>Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    const newDiff = e.target.value as Difficulty;
                    setDifficulty(newDiff);
                    if (gameStatus !== 'not-started') {
                      resetGame();
                    }
                  }}
                  disabled={gameStatus === 'playing'}
                  className="snake-setting-select"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="snake-setting-group">
                <label>Mode:</label>
                <select
                  value={gameMode}
                  onChange={(e) => {
                    const newMode = e.target.value as 'classic' | 'walls';
                    setGameMode(newMode);
                    if (gameStatus !== 'not-started') {
                      resetGame();
                    }
                  }}
                  disabled={gameStatus === 'playing'}
                  className="snake-setting-select"
                >
                  <option value="classic">Classic (Wrap-around)</option>
                  <option value="walls">Walls Mode</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="snake-stats-container">
        <div className="snake-stats-grid">
          <div className="snake-stat-card snake-stat-score">
            <div className="snake-stat-header">
              <Zap className="snake-stat-icon" />
              <span className="snake-stat-label">Score</span>
            </div>
            <div className="snake-stat-value">{score}</div>
            {isNewHighScore && (
              <div className="snake-new-highscore-badge">
                <Crown size={14} /> New Record!
              </div>
            )}
          </div>

          <div className="snake-stat-card snake-stat-highscore">
            <div className="snake-stat-header">
              <Trophy className="snake-stat-icon" />
              <span className="snake-stat-label">High Score</span>
            </div>
            <div className="snake-stat-value">{highScore}</div>
            <div className="snake-stat-subtext">({difficulty})</div>
            {/* Debug info - remove in production */}
            <div className="snake-debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
              Updated: {dataTimestamp ? new Date(dataTimestamp).toLocaleTimeString() : 'Never'}
            </div>
          </div>

          <div className="snake-stat-card snake-stat-time">
            <div className="snake-stat-header">
              <Clock className="snake-stat-icon" />
              <span className="snake-stat-label">Time</span>
            </div>
            <div className="snake-stat-value">{formatTime(time)}</div>
          </div>

          <div className="snake-stat-card snake-stat-difficulty">
            <div className="snake-stat-header">
              <Gauge className="snake-stat-icon" />
              <span className="snake-stat-label">Difficulty</span>
            </div>
            <div className="snake-stat-value">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
            <div className="snake-stat-subtext">Speed: {getSpeedPercentage()}</div>
          </div>
        </div>

        <div className="snake-highscores-summary">
          <div className="snake-highscores-title">
            <Trophy size={16} />
            <span>Your High Scores</span>
            <button
              onClick={() => fetchUserData(true)}
              className="snake-refresh-button"
              style={{
                marginLeft: '10px',
                background: 'transparent',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          <div className="snake-highscores-grid">
            <div className="snake-highscore-item diff-easy">
              <span className="snake-highscore-label">Easy:</span>
              <span className="snake-highscore-value">{allHighScores.easy}</span>
            </div>
            <div className="snake-highscore-item diff-medium">
              <span className="snake-highscore-label">Medium:</span>
              <span className="snake-highscore-value">{allHighScores.medium}</span>
            </div>
            <div className="snake-highscore-item diff-hard">
              <span className="snake-highscore-label">Hard:</span>
              <span className="snake-highscore-value">{allHighScores.hard}</span>
            </div>
          </div>
        </div>

        {gameStatus === 'paused' && (
          <div className="snake-status-message warning">
            ⏸️ Game Paused - Press SPACE or click Resume to continue
          </div>
        )}
        {gameStatus === 'game-over' && (
          <div className="snake-status-message error">
            🎮 Game Over! Final Score: {score}
            {isNewHighScore && " 🏆 NEW HIGH SCORE!"}
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
              {gameStatus === 'not-started' || gameStatus === 'game-over' ? (
                <button
                  onClick={startGame}
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
              ) : (
                <button
                  onClick={togglePause}
                  className="snake-button snake-button-success"
                >
                  ▶️ Resume Game
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
                <li>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to control the snake</li>
                <li>Eat <span className="food-sample">●</span> to grow and score points</li>
                <li>{gameMode === 'classic' ? 'Pass through walls (wrap-around)' : 'Avoid walls (game over on collision)'}</li>
                <li>Avoid colliding with yourself</li>
                <li>Press <strong>SPACE</strong> or <strong>ESC</strong> to pause/resume</li>
                <li>Your high scores are saved automatically!</li>
                <li>Difficulty affects speed and points:
                  <ul className="snake-difficulty-list">
                    <li><span className="diff-easy">Easy</span>: Slow speed, 10 points per food</li>
                    <li><span className="diff-medium">Medium</span>: Medium speed, 15 points per food</li>
                    <li><span className="diff-hard">Hard</span>: Fast speed, 20 points per food</li>
                  </ul>
                </li>
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
              <h4>Current Game Info:</h4>
              <div className="snake-info-grid">
                <div className="snake-info-item">
                  <span className="snake-info-label">Mode</span>
                  <span className="snake-info-value">{gameMode === 'classic' ? 'Classic' : 'Walls'}</span>
                </div>
                <div className="snake-info-item">
                  <span className="snake-info-label">Grid Size</span>
                  <span className="snake-info-value">{GRID_SIZE}×{GRID_SIZE}</span>
                </div>
                <div className="snake-info-item">
                  <span className="snake-info-label">Snake Length</span>
                  <span className="snake-info-value">{snake.length}</span>
                </div>
                <div className="snake-info-item">
                  <span className="snake-info-label">Status</span>
                  <span className="snake-info-value">
                    {gameStatus === 'playing' ? 'Playing' :
                      gameStatus === 'paused' ? 'Paused' :
                        gameStatus === 'game-over' ? 'Game Over' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {gameStatus === 'game-over' && (
        <div className="snake-game-overlay">
          <div className="snake-game-over-card">
            <div className="snake-game-over-emoji">
              {isNewHighScore ? '👑' : '🎮'}
            </div>
            <h3 className="snake-game-over-title">
              {isNewHighScore ? 'New High Score!' : 'Game Over!'}
            </h3>
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
                <span className="snake-stat-label">High Score ({difficulty}):</span>
                <span className="snake-stat-value">{highScore}</span>
              </div>
              <div className="snake-stat-result">
                <span className="snake-stat-label">Snake Length:</span>
                <span className="snake-stat-value">{snake.length}</span>
              </div>
            </div>

            <div className="snake-game-over-message">
              {isNewHighScore ? (
                <div className="new-highscore-message">
                  <Crown className="crown-icon" />
                  <span>Congratulations! You set a new high score for {difficulty} difficulty!</span>
                  <Crown className="crown-icon" />
                </div>
              ) : (
                <div className="regular-message">
                  Great effort! Your high score for {difficulty} difficulty is {highScore}.
                </div>
              )}
            </div>

            <div className="snake-game-over-buttons">
              <button
                onClick={startGame}
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
                Game Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}