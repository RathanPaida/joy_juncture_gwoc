"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Timer, RefreshCw, Trophy, HelpCircle,
  Zap, Lock, Coins, AlertCircle, Gamepad2,
  Check, X, Heart, Keyboard, Eye
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./word-guesser-game.css";

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

const WORD_GUESSER_GAME_ID = "word-guesser";
const WORD_GUESSER_GAME_NAME = "Word Guesser";
const MAX_ATTEMPTS = 6;
const BASE_COINS = 5;
const HINT_COUNT = 1;

/* ---------------- WORD LIST ---------------- */
const GAME_WORDS = [
  { word: "CHESS", category: "Board Games", hint: "Strategic board game with kings and queens" },
  { word: "PUZZLE", category: "Puzzles", hint: "Jigsaw or crossword, tests your brain" },
  { word: "ARCADE", category: "Gaming", hint: "Classic gaming venue with coin machines" },
  { word: "CONTROLLER", category: "Gaming", hint: "Device used to play video games" },
  { word: "STRATEGY", category: "Game Types", hint: "Requires planning and thinking ahead" },
  { word: "ADVENTURE", category: "Game Types", hint: "Exploration and story-driven gameplay" },
  { word: "PLATFORM", category: "Game Types", hint: "Jumping between platforms in games" },
  { word: "ROULETTE", category: "Casino", hint: "Spinning wheel casino game" },
  { word: "JOKER", category: "Card Games", hint: "Wild card in many card games" },
  { word: "CHECKMATE", category: "Board Games", hint: "Winning move in chess" },
  { word: "DUNGEON", category: "RPG", hint: "Underground area in role-playing games" },
  { word: "AVATAR", category: "Gaming", hint: "Player's character in a game" },
  { word: "QUEST", category: "RPG", hint: "Mission or task in role-playing games" },
  { word: "LEVEL", category: "Gaming", hint: "Stage or phase in a game" },
  { word: "SCORE", category: "Gaming", hint: "Points earned in a game" },
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

/* ---------------- COMPONENT ---------------- */

export default function WordGuesserGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const [currentWord, setCurrentWord] = useState<{ word: string, category: string, hint: string } | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [time, setTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [feedback, setFeedback] = useState("");

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
        const playedToday = hasPlayedToday(userData, WORD_GUESSER_GAME_ID);
        setCanPlay(!playedToday);

        if (playedToday) {
          setNextPlayTime(getNextPlayTime(userData, WORD_GUESSER_GAME_ID));
          setGameMessage("🚫 You have already played Word Guesser today!");
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
        setNextPlayTime(getNextPlayTime(user, WORD_GUESSER_GAME_ID));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  /* ---------------- INITIALIZE GAME ---------------- */
  const initializeGame = useCallback(() => {
    if (!canPlay) return;

    // Select random word
    const randomWord = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
    setCurrentWord(randomWord);
    setGuesses([]);
    setCurrentGuess("");
    setTime(0);
    setAttempts(0);
    setGameStarted(false);
    setGameCompleted(false);
    setHintsUsed(0);
    setEarnedCoins(0);
    setFeedback("");

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
  const handleGuess = () => {
    if (!currentWord || gameCompleted || !canPlay || !currentGuess.trim()) return;

    const guess = currentGuess.trim().toUpperCase();

    if (guess.length !== currentWord.word.length) {
      setFeedback(`❌ Word must be ${currentWord.word.length} letters!`);
      setTimeout(() => setFeedback(""), 2000);
      return;
    }

    if (!gameStarted) setGameStarted(true);

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setGuesses([...guesses, guess]);
    setCurrentGuess("");

    if (guess === currentWord.word) {
      finishGame(true);
    } else if (newAttempts >= MAX_ATTEMPTS) {
      finishGame(false);
    } else {
      setFeedback("❌ Incorrect! Try again.");
      setTimeout(() => setFeedback(""), 1500);
    }

    // Focus input again
    inputRef.current?.focus();
  };

  const useHint = () => {
    if (hintsUsed >= HINT_COUNT || gameCompleted || !canPlay || !currentWord) return;

    setHintsUsed(prev => prev + 1);
    setFeedback(`💡 Hint: ${currentWord.hint}`);
    setTimeout(() => setFeedback(""), 3000);
  };

  const revealWord = () => {
    if (!currentWord || gameCompleted || !canPlay) return;
    finishGame(false);
  };

  /* ---------------- FINISH GAME ---------------- */
  const calculateCoins = (isWin: boolean): number => {
    if (!isWin) return 10;

    // Base coins + attempts bonus + time bonus + hint penalty
    const attemptsBonus = (MAX_ATTEMPTS - attempts) * 5;
    const timeBonus = Math.max(0, Math.floor((180 - time) / 5)); // 3 minutes max
    const hintPenalty = hintsUsed * 10;

    return Math.max(10, BASE_COINS + attemptsBonus + timeBonus - hintPenalty);
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

      const score = isWin ? Math.max(0, 1000 - (attempts * 100) - Math.floor(time / 5) - (hintsUsed * 150)) : 0;

      const markPlayedResponse = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: WORD_GUESSER_GAME_ID,
          gameName: WORD_GUESSER_GAME_NAME,
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
                gameId: WORD_GUESSER_GAME_ID,
                gameName: WORD_GUESSER_GAME_NAME,
                playedAt: new Date(),
                score: score,
                pointsEarned: coins,
                completed: true
              }
            ]
          };
          setNextPlayTime(getNextPlayTime(tempUser, WORD_GUESSER_GAME_ID));
          return;
        }
        setGameMessage("❌ Failed to save your game progress. Please try again.");
        return;
      }

      if (responseData.success) {
        // Update local state immediately
        const newGameRecord = {
          gameId: WORD_GUESSER_GAME_ID,
          gameName: WORD_GUESSER_GAME_NAME,
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
          setNextPlayTime(getNextPlayTime(updatedUser, WORD_GUESSER_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(isWin
          ? `🎉 Congratulations! You guessed the word in ${attempts} attempts! Earned ${coins} coins.`
          : `😢 The word was "${currentWord?.word}". Earned ${coins} coins. Try again tomorrow!`
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

  /* ---------------- LETTER CHECK ---------------- */
  const checkLetter = (letter: string, position: number): string => {
    if (!currentWord) return "incorrect";

    if (currentWord.word[position] === letter) {
      return "correct";
    } else if (currentWord.word.includes(letter)) {
      return "wrong-position";
    }
    return "incorrect";
  };

  /* ---------------- UI RENDER ---------------- */
  if (authLoading) {
    return (
      <div className="word-guesser-loading-screen">
        <div className="word-guesser-loading-message">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="word-guesser-loading-screen">
        <div className="word-guesser-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="word-guesser-loading-screen">
        <div className="word-guesser-loading-message">Redirecting to login...</div>
      </div>
    );
  }

  // Show "Already Played" screen
  if (!canPlay && !gameStarted) {
    return (
      <div className="word-guesser-game-container">
        <div className="word-guesser-game-wrapper">
          <header className="word-guesser-game-header">
            <div className="word-guesser-header-card">
              <div className="word-guesser-header-content">
                <div>
                  <h1 className="word-guesser-game-title">
                    <Keyboard className="word-guesser-title-icon" />
                    Word Guesser
                  </h1>
                  <p className="word-guesser-welcome-message">
                    Welcome, <span className="word-guesser-username">{user.name}</span>!
                  </p>
                </div>
                <div className="word-guesser-user-coins">
                  <div className="word-guesser-coins-display">
                    <Coins className="word-guesser-coins-icon" />
                    <span className="word-guesser-coins-value">{user.userPoints}</span>
                  </div>
                  <div className="word-guesser-coins-label">Total Coins</div>
                </div>
              </div>
            </div>
          </header>

          <div className="word-guesser-already-played">
            <div className="word-guesser-locked-card">
              <Lock className="word-guesser-lock-icon" />
              <h2 className="word-guesser-locked-title">Game Already Played Today</h2>
              <p className="word-guesser-locked-message">
                {gameMessage || "🚫 You have already played Word Guesser today!"}
              </p>
              <div className="word-guesser-next-play">
                <div className="word-guesser-next-play-label">Next available in:</div>
                <div className="word-guesser-next-play-time">{nextPlayTime || "Calculating..."}</div>
              </div>
              <p className="word-guesser-locked-hint">
                Come back tomorrow for a new word challenge!
              </p>
              <button
                onClick={() => router.push("/zone")}
                className="word-guesser-button word-guesser-button-primary"
              >
                <Gamepad2 className="word-guesser-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="word-guesser-loading-screen">
        <div className="word-guesser-loading-message">Preparing word...</div>
      </div>
    );
  }

  return (
    <div className="word-guesser-game-container">
      <div className="word-guesser-game-wrapper">
        {/* Header */}
        <header className="word-guesser-game-header">
          <div className="word-guesser-header-card">
            <div className="word-guesser-header-content">
              <div>
                <h1 className="word-guesser-game-title">
                  <Keyboard className="word-guesser-title-icon" />
                  Word Guesser
                </h1>
                <p className="word-guesser-welcome-message">
                  Welcome, <span className="word-guesser-username">{user.name}</span>! Guess the game-related word.
                </p>
              </div>
              <div className="word-guesser-user-coins">
                <div className="word-guesser-coins-display">
                  <Coins className="word-guesser-coins-icon" />
                  <span className="word-guesser-coins-value">{user.userPoints}</span>
                </div>
                <div className="word-guesser-coins-label">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        {/* Game Stats */}
        <div className="word-guesser-stats-container">
          <div className="word-guesser-stats-grid">
            <div className="word-guesser-stat-card word-guesser-stat-time">
              <div className="word-guesser-stat-header">
                <Timer className="word-guesser-stat-icon" />
                <span className="word-guesser-stat-label">Time</span>
              </div>
              <div className="word-guesser-stat-value">{formatTime(time)}</div>
            </div>

            <div className="word-guesser-stat-card word-guesser-stat-attempts">
              <div className="word-guesser-stat-header">
                <Heart className="word-guesser-stat-icon" />
                <span className="word-guesser-stat-label">Attempts</span>
              </div>
              <div className="word-guesser-stat-value">{attempts}/{MAX_ATTEMPTS}</div>
            </div>

            <div className="word-guesser-stat-card word-guesser-stat-hints">
              <div className="word-guesser-stat-header">
                <HelpCircle className="word-guesser-stat-icon" />
                <span className="word-guesser-stat-label">Hints</span>
              </div>
              <div className="word-guesser-stat-value">{HINT_COUNT - hintsUsed}</div>
            </div>

            <div className="word-guesser-stat-card word-guesser-stat-length">
              <div className="word-guesser-stat-header">
                <Zap className="word-guesser-stat-icon" />
                <span className="word-guesser-stat-label">Word Length</span>
              </div>
              <div className="word-guesser-stat-value">{currentWord.word.length}</div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`word-guesser-feedback-message ${feedback.includes("✅") ? "success" :
              feedback.includes("❌") ? "error" :
                "hint"
              }`}>
              {feedback}
            </div>
          )}

          {/* Game Message */}
          {gameMessage && (
            <div className="word-guesser-game-message">
              <div className={`word-guesser-message-card ${gameMessage.includes("🎉") ? 'success' : gameMessage.includes("🚫") ? 'error' : 'info'}`}>
                {gameMessage}
              </div>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="word-guesser-info-card">
          <div className="word-guesser-info-content">
            <div className="word-guesser-category">
              <span className="word-guesser-category-label">Category:</span>
              <span className="word-guesser-category-value">{currentWord.category}</span>
            </div>
            <div className="word-guesser-difficulty">
              <span className="word-guesser-difficulty-label">Difficulty:</span>
              <span className="word-guesser-difficulty-value">Medium</span>
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="word-guesser-controls-container">
          <div className="word-guesser-controls-group">
            <button
              onClick={initializeGame}
              className="word-guesser-button word-guesser-button-restart"
            >
              <RefreshCw className="word-guesser-button-icon" />
              New Word
            </button>

            <button
              onClick={useHint}
              disabled={hintsUsed >= HINT_COUNT || gameCompleted}
              className="word-guesser-button word-guesser-button-hint"
            >
              <HelpCircle className="word-guesser-button-icon" />
              Use Hint ({HINT_COUNT - hintsUsed} left)
            </button>

            <button
              onClick={revealWord}
              disabled={gameCompleted}
              className="word-guesser-button word-guesser-button-secondary"
            >
              <Eye className="word-guesser-button-icon" />
              Reveal Word
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="word-guesser-game-area">
          {/* Guesses Board */}
          <div className="word-guesser-board-section">
            <div className="word-guesser-board-card">
              <div className="word-guesser-board">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => (
                  <div key={rowIndex} className="word-guesser-row">
                    {Array.from({ length: currentWord.word.length }).map((_, colIndex) => {
                      const guess = guesses[rowIndex];
                      const letter = guess?.[colIndex];
                      let cellClass = "word-guesser-cell";

                      if (letter) {
                        const result = checkLetter(letter, colIndex);
                        cellClass += ` word-guesser-cell-${result}`;
                      } else if (rowIndex === guesses.length && colIndex === currentGuess.length) {
                        cellClass += " word-guesser-cell-active";
                      }

                      return (
                        <div key={colIndex} className={cellClass}>
                          {letter || ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="word-guesser-input-section">
            <div className="word-guesser-input-card">
              <h3 className="word-guesser-input-title">
                Enter your guess ({currentWord.word.length} letters)
              </h3>

              <div className="word-guesser-input-group">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentGuess}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    if (value.length <= currentWord.word.length) {
                      setCurrentGuess(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGuess();
                    }
                  }}
                  disabled={gameCompleted}
                  className="word-guesser-input"
                  placeholder="Type your guess here..."
                  maxLength={currentWord.word.length}
                />

                <button
                  onClick={handleGuess}
                  disabled={!currentGuess.trim() || gameCompleted}
                  className="word-guesser-submit-button"
                >
                  Guess
                </button>
              </div>

              <div className="word-guesser-input-hint">
                Press Enter or click Guess to submit
              </div>
            </div>

            {/* Instructions */}
            <div className="word-guesser-instructions">
              <h3 className="word-guesser-side-title">How to Play</h3>
              <ul className="word-guesser-instructions-list">
                <li>Guess the {currentWord.word.length}-letter game-related word</li>
                <li>You have {MAX_ATTEMPTS} attempts</li>
                <li><span className="word-guesser-example-correct">Green</span> = Correct letter, correct position</li>
                <li><span className="word-guesser-example-wrong-pos">Yellow</span> = Correct letter, wrong position</li>
                <li><span className="word-guesser-example-incorrect">Gray</span> = Incorrect letter</li>
                <li>Use hints if you get stuck!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Game Completed Overlay */}
        {gameCompleted && (
          <div className="word-guesser-completion-overlay">
            <div className="word-guesser-completion-card">
              <div className="word-guesser-completion-emoji">
                {attempts <= MAX_ATTEMPTS && guesses.includes(currentWord.word) ? "🎉" : "😢"}
              </div>
              <h3 className="word-guesser-completion-title">
                {attempts <= MAX_ATTEMPTS && guesses.includes(currentWord.word)
                  ? "You Guessed It!"
                  : "Game Over!"}
              </h3>

              {attempts <= MAX_ATTEMPTS && guesses.includes(currentWord.word) ? (
                <p className="word-guesser-completion-text">
                  You guessed "<strong>{currentWord.word}</strong>" in {attempts} attempts!
                </p>
              ) : (
                <p className="word-guesser-completion-text">
                  The word was "<strong>{currentWord.word}</strong>"
                </p>
              )}

              <div className="word-guesser-coins-earned">
                +{earnedCoins} coins earned!
              </div>
              <div className="word-guesser-total-coins">
                Total coins: <span className="word-guesser-total-coins-value">{user.userPoints}</span>
              </div>

              {gameMessage && (
                <div className="word-guesser-game-status">
                  <p>{gameMessage}</p>
                </div>
              )}

              <div className="word-guesser-next-play-info">
                <p>Come back tomorrow for a new word!</p>
                <p className="word-guesser-next-play-hint">Next play available: {nextPlayTime || "Calculating..."}</p>
              </div>
              <button
                onClick={() => router.push("/zone")}
                className="word-guesser-button word-guesser-button-primary"
              >
                <Gamepad2 className="word-guesser-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}