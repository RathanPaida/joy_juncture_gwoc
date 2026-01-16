"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, RefreshCw, Trophy, Gamepad2, Lock, Coins, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./memory-game.css";

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
}

interface GameCard {
  id: string;
  pairId: string;
  name: string;
  imageUrl: string;
}

const MEMORY_GAME_ID = "memory-game";
const MEMORY_GAME_NAME = "Memory Challenge";
const TOTAL_PAIRS = 8;
const TOTAL_CARDS = TOTAL_PAIRS * 2;
const BASE_COINS = 10;

export default function MemoryGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState<string>("");

  const CARD_BACK = "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png";

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
        const playedToday = hasPlayedToday(userData, MEMORY_GAME_ID);
        setCanPlay(!playedToday);

        if (playedToday) {
          setNextPlayTime(getNextPlayTime(userData, MEMORY_GAME_ID));
          setGameMessage("🚫 You have already played Memory Game today!");
        }
        setLoading(false);
      } else {
        router.push("/login");
      }
    };

    initUser();
  }, [authUser, authLoading, router, fetchUserData]);

  useEffect(() => {
    if (!canPlay) {
      const interval = setInterval(() => {
        setNextPlayTime(getNextPlayTime(user, MEMORY_GAME_ID));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch("/api/games/public");
        const data = await res.json();
        if (data.success) setGames(data.data);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };
    fetchGames();
  }, []);

  const initializeGame = useCallback(() => {
    if (games.length === 0 || !canPlay) return;

    let selected = [...games];

    while (selected.length < 8) {
      selected = [...selected, ...games];
    }

    const shuffled = selected.sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 8);

    const preparedCards: GameCard[] = chosen.flatMap((g) => [
      { id: `${g.id}-a`, pairId: g.id, name: g.name, imageUrl: g.imageUrl },
      { id: `${g.id}-b`, pairId: g.id, name: g.name, imageUrl: g.imageUrl }
    ]);

    setCards(preparedCards.sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTime(0);
    setGameStarted(false);
    setGameCompleted(false);
    setEarnedCoins(0);
    setGameMessage("");
  }, [games, canPlay]);

  useEffect(() => {
    if (games.length && canPlay) initializeGame();
  }, [games, canPlay, initializeGame]);

  const handleCardClick = (index: number) => {
    if (!canPlay || flipped.length === 2 || flipped.includes(index) || gameCompleted) return;

    if (!gameStarted) setGameStarted(true);

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);

      setTimeout(() => {
        const [i1, i2] = next;
        if (cards[i1].pairId === cards[i2].pairId) {
          const newMatched = [...matched, cards[i1].pairId];
          setMatched(newMatched);
          if (newMatched.length === 8) finishGame();
        }
        setFlipped([]);
      }, 600);
    }
  };

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted]);

  const calculateCoins = () => {
    const timeBonus = Math.max(0, Math.floor((120 - time) / 5));
    const movesBonus = Math.max(0, 20 - Math.floor(moves / 4));
    const totalCoins = Math.max(10, BASE_COINS + timeBonus + movesBonus);
    return totalCoins;
  };

  const finishGame = async () => {
    setGameCompleted(true);
    const coins = calculateCoins();
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

      const score = Math.max(0, 1000 - (moves * 10) - (time * 2));

      const markPlayedResponse = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: MEMORY_GAME_ID,
          gameName: MEMORY_GAME_NAME,
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
                gameId: MEMORY_GAME_ID,
                gameName: MEMORY_GAME_NAME,
                playedAt: new Date(),
                score: score,
                pointsEarned: coins,
                completed: true
              }
            ]
          };
          setNextPlayTime(getNextPlayTime(tempUser, MEMORY_GAME_ID));
          return;
        }
        setGameMessage("❌ Failed to save your game progress. Please try again.");
        return;
      }

      if (responseData.success) {
        // Update local user state immediately with new game record
        const newGameRecord = {
          gameId: MEMORY_GAME_ID,
          gameName: MEMORY_GAME_NAME,
          playedAt: new Date(),
          score: score,
          pointsEarned: coins,
          completed: true
        };

        const updatedUser = user ? {
          ...user,
          userPoints: responseData.userPoints || user.userPoints,
          gamesPlayed: [...(user.gamesPlayed || []), newGameRecord]
        } : null;

        if (updatedUser) {
          setUser(updatedUser);
          setNextPlayTime(getNextPlayTime(updatedUser, MEMORY_GAME_ID));
        }

        setCanPlay(false);
        setCanPlay(false);
        setGameMessage(`🎉 Congratulations! You completed the game in ${moves} moves and earned ${coins} coins!`);
      }

    } catch (error) {
      console.error("❌ Exception during game completion:", error);
      setGameMessage("❌ An error occurred while saving your progress. Please try again.");
    }
  };

  if (authLoading) {
    return (
      <div className="memory-loading-screen">
        <div className="memory-loading-message">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="memory-loading-screen">
        <div className="memory-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="memory-loading-screen">
        <div className="memory-loading-message">Redirecting to login...</div>
      </div>
    );
  }

  if (!canPlay && !gameStarted) {
    return (
      <div className="memory-game-container">
        <div className="memory-game-wrapper">
          <header className="memory-game-header">
            <div className="memory-header-card">
              <div className="memory-header-content">
                <div>
                  <h1 className="memory-game-title">
                    <Gamepad2 className="memory-title-icon" />
                    Memory Challenge
                  </h1>
                  <p className="memory-welcome-message">
                    Welcome, <span className="memory-username">{user.name}</span>!
                  </p>
                </div>
                <div className="memory-user-coins">
                  <div className="memory-coins-display">
                    <Coins className="memory-coins-icon" />
                    <span className="memory-coins-value">{user.userPoints}</span>
                  </div>
                  <div className="memory-coins-label">Total Coins</div>
                </div>
              </div>
            </div>
          </header>

          <div className="memory-already-played">
            <div className="memory-locked-card">
              <Lock className="memory-lock-icon" />
              <h2 className="memory-locked-title">Game Already Played Today</h2>
              <p className="memory-locked-message">
                {gameMessage || "🚫 You have already played Memory Game today!"}
              </p>
              <div className="memory-next-play">
                <div className="memory-next-play-label">Next available in:</div>
                <div className="memory-next-play-time">{nextPlayTime || "Calculating..."}</div>
              </div>
              <p className="memory-locked-hint">
                Come back tomorrow for another challenge!
              </p>
              <button
                onClick={() => router.push("/zone")}
                className="memory-button memory-button-primary"
              >
                <Gamepad2 className="memory-button-icon" />
                Return to Game Zone
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="memory-loading-screen">
        <div className="memory-loading-message">Preparing game...</div>
      </div>
    );
  }

  return (
    <div className="memory-game-container">
      <div className="memory-game-wrapper">
        <header className="memory-game-header">
          <div className="memory-header-card">
            <div className="memory-header-content">
              <div>
                <h1 className="memory-game-title">
                  <Gamepad2 className="memory-title-icon" />
                  Memory Challenge
                </h1>
                <p className="memory-welcome-message">
                  Welcome, <span className="memory-username">{user.name}</span>! Find matching pairs to earn coins.
                </p>
              </div>
              <div className="memory-user-coins">
                <div className="memory-coins-display">
                  <Coins className="memory-coins-icon" />
                  <span className="memory-coins-value">{user.userPoints}</span>
                </div>
                <div className="memory-coins-label">Total Coins</div>
              </div>
            </div>
          </div>
        </header>

        <div className="memory-stats-container">
          <div className="memory-stats-grid">
            <div className="memory-stat-card">
              <Timer className="memory-stat-icon" />
              <div className="memory-stat-label">Time</div>
              <div className="memory-stat-value">{time}s</div>
            </div>

            <div className="memory-stat-card">
              <RefreshCw className="memory-stat-icon" />
              <div className="memory-stat-label">Moves</div>
              <div className="memory-stat-value">{moves}</div>
            </div>

            <div className="memory-stat-card">
              <Trophy className="memory-stat-icon" />
              <div className="memory-stat-label">Matches</div>
              <div className="memory-stat-value">{matched.length}/{TOTAL_PAIRS}</div>
            </div>

            <div className="memory-stat-card">
              <Gamepad2 className="memory-stat-icon" />
              <div className="memory-stat-label">Cards</div>
              <div className="memory-stat-value">{TOTAL_CARDS}</div>
            </div>
          </div>

          {gameMessage && (
            <div className="memory-message">
              <div className={`memory-message-card ${gameMessage.includes('🎉') ? 'success' : gameMessage.includes('🚫') ? 'error' : 'info'}`}>
                {gameMessage}
              </div>
            </div>
          )}
        </div>

        <div className="memory-board-container">
          <div className="memory-board">
            {cards.map((card, index) => {
              const isFlipped = flipped.includes(index) || matched.includes(card.pairId);
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  className={`memory-card ${isFlipped ? 'memory-card-flipped' : ''}`}
                  disabled={isFlipped || gameCompleted}
                >
                  <div className="memory-card-front">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="memory-card-image"
                    />
                  </div>
                  <div className="memory-card-back">
                    <img
                      src={CARD_BACK}
                      alt="Card back"
                      className="memory-card-back-image"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="memory-controls">
          <button
            onClick={initializeGame}
            className="memory-button memory-button-restart"
          >
            <RefreshCw className="memory-button-icon" />
            Restart Game
          </button>
        </div>

        {gameCompleted && (
          <div className="memory-game-over">
            <div className="memory-completion-card">
              <h3>🎉 Memory Challenge Complete!</h3>
              <p>Time: {time}s • Moves: {moves}</p>
              <div className="memory-coins-earned">
                +{earnedCoins} coins earned!
              </div>
              <div className="memory-total-coins">
                Total coins: <span>{user.userPoints || 0}</span>
              </div>

              {gameMessage && (
                <div className="memory-game-status">
                  <p>{gameMessage}</p>
                </div>
              )}

              <div className="memory-next-play-info">
                <p>Come back tomorrow to play again!</p>
                <p className="memory-next-play-hint">
                  Next play available: {nextPlayTime}
                </p>
              </div>
              <button
                onClick={() => router.push("/zone")}
                className="memory-button memory-button-primary"
              >
                Return to Game Zone
              </button>
            </div>
          </div>
        )}

        {!gameStarted && (
          <div className="memory-instructions">
            <p className="memory-instructions-text">
              💡 <strong>How to play:</strong> Click on cards to flip them and find matching pairs. Complete all {TOTAL_PAIRS} pairs to win!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}