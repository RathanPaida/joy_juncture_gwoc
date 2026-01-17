// ============================================
// MEMORY GAME - ONCE PER DAY VERSION
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, RefreshCw, Trophy, Gamepad2, Lock } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./memory-game.css";

/* ---------------- TYPES ---------------- */

interface User {
  _id: string;
  name: string;
  totalPoints: number;
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
const MEMORY_GAME_NAME = "Memory Game";

/* ---------------- HELPER FUNCTIONS ---------------- */

// Check if user has played this game today (FIXED - USE UTC)
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

// Get next available play time (FIXED - USE UTC)
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
  const [gameOver, setGameOver] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState<string>("");

  const CARD_BACK =
    "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png";

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
        console.log("✅ User data fetched:", {
          name: data.user.name,
          totalPoints: data.user.totalPoints,
          gamesPlayedCount: data.user.gamesPlayed?.length,
          gamesPlayed: data.user.gamesPlayed?.map((game: any) => ({
            gameId: game.gameId,
            gameName: game.gameName,
            playedAt: game.playedAt,
            pointsEarned: game.pointsEarned
          }))
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
        const playedToday = hasPlayedToday(userData, MEMORY_GAME_ID);
        console.log("🔍 Can user play today?", {
          playedToday,
          gameId: MEMORY_GAME_ID,
          gamesPlayed: userData.gamesPlayed?.filter(g => g.gameId === MEMORY_GAME_ID)
        });
        
        setCanPlay(!playedToday);
        
        if (playedToday) {
          const nextTime = getNextPlayTime(userData, MEMORY_GAME_ID);
          console.log("⏰ Next play time:", nextTime);
          setNextPlayTime(nextTime);
          setGameMessage("🚫 You have already played Memory Game today!");
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
        setNextPlayTime(getNextPlayTime(user, MEMORY_GAME_ID));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [canPlay, user]);

  /* ---------------- FETCH GAMES ---------------- */

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

  /* ---------------- INITIALIZE GAME ---------------- */

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
    setGameOver(false);
    setEarnedCoins(0);
    setGameMessage("");
  }, [games, canPlay]);

  useEffect(() => {
    if (games.length && canPlay) initializeGame();
  }, [games, canPlay, initializeGame]);

  /* ---------------- GAME LOGIC ---------------- */

  const handleCardClick = (index: number) => {
    if (!canPlay || flipped.length === 2 || flipped.includes(index) || gameOver) return;

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

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const t = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(t);
  }, [gameStarted, gameOver]);

  /* ---------------- FINISH GAME ---------------- */

  const finishGame = async () => {
    setGameOver(true);

    const coins = Math.max(50 - moves - Math.floor(time / 5), 10);
    const score = Math.max(1000 - (moves * 10) - (time * 2), 100);
    setEarnedCoins(coins);

    if (!user) {
      console.error("❌ No user found when finishing game");
      return;
    }

    console.log("🎮 Game finished! Marking as played and adding coins:", { 
      gameId: MEMORY_GAME_ID,
      gameName: MEMORY_GAME_NAME,
      userId: user._id, 
      coinsToAdd: coins,
      score: score,
      currentPoints: user.totalPoints
    });

    try {
      const token = await getIdToken();
      
      if (!token) {
        console.error("❌ Failed to get authentication token");
        setGameMessage("❌ Failed to save your progress. Please check your connection.");
        return;
      }

      console.log("✅ Token obtained successfully");

      // Mark game as played
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
          totalPoints: responseData.totalPoints || prev.totalPoints
        } : prev);
        
        setCanPlay(false);
        
        // Get next play time
        if (user.gamesPlayed) {
          const updatedGames = [...user.gamesPlayed, {
            gameId: MEMORY_GAME_ID,
            gameName: MEMORY_GAME_NAME,
            playedAt: new Date(),
            score: score,
            pointsEarned: coins,
            completed: true
          }];
          const tempUser = { ...user, gamesPlayed: updatedGames };
          const nextTime = getNextPlayTime(tempUser, MEMORY_GAME_ID);
          console.log("⏰ Setting next play time to:", nextTime);
          setNextPlayTime(nextTime);
        }
        
        // Set success message
        setGameMessage(`🎉 Congratulations! You earned ${coins} coins! Come back tomorrow to play again.`);
        
        // Also refresh full user data
        const refreshedUser = await fetchUserData();
        if (refreshedUser) {
          console.log("✅ User data refreshed successfully!");
          console.log("💰 New user points:", refreshedUser.totalPoints);
          setUser(refreshedUser);
        }
      }

    } catch (error) {
      console.error("❌ Exception during game completion:", error);
      setGameMessage("❌ An error occurred while saving your progress. Please try again.");
    }
  };

  /* ---------------- UI ---------------- */

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
        <div className="memory-loading-message">Loading game data...</div>
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

  // Show "Already Played" screen
  if (!canPlay && !gameStarted) {
    console.log("🔒 Showing already played screen");
    return (
      <div className="memory-game-container">
        <div className="memory-user-info">
          <div className="memory-user-header">
            <div>
              <h1 className="memory-game-title">Memory Game</h1>
              <p className="memory-welcome-message">
                Welcome, <span className="memory-username">{user.name}</span>!
              </p>
            </div>
            <div className="memory-user-coins">
              <div className="memory-coins-value">{user.totalPoints}</div>
              <div className="memory-coins-label">Coins</div>
            </div>
          </div>
        </div>

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
              Come back tomorrow for another chance to earn coins!
            </p>
            <button
              onClick={() => router.push("/home")}
              className="memory-button"
            >
              Return to Home
            </button>
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
      {/* User info */}
      <div className="memory-user-info">
        <div className="memory-user-header">
          <div>
            <h1 className="memory-game-title">Memory Game</h1>
            <p className="memory-welcome-message">
              Welcome, <span className="memory-username">{user.name}</span>!
            </p>
          </div>
          <div className="memory-user-coins">
            <div className="memory-coins-value">{user.totalPoints}</div>
            <div className="memory-coins-label">Coins</div>
          </div>
        </div>
      </div>

      {/* Game stats */}
      <div className="memory-stats-grid">
        <Stat icon={<Timer className="memory-stat-icon" />} value={`${time}s`} label="Time" />
        <Stat icon={<RefreshCw className="memory-stat-icon" />} value={moves} label="Moves" />
        <Stat icon={<Trophy className="memory-stat-icon" />} value={`${matched.length}/8`} label="Matches" />
        <Stat icon={<Gamepad2 className="memory-stat-icon" />} value="16" label="Cards" />
        <Stat value={user.totalPoints} label="Coins" />
      </div>

      {/* Game message display */}
      {gameMessage && (
        <div className="memory-game-message">
          <div className={`memory-message-card ${gameMessage.includes("🎉") ? 'success' : gameMessage.includes("🚫") ? 'error' : 'info'}`}>
            {gameMessage}
          </div>
        </div>
      )}

      {/* Game board */}
      <div className="memory-board">
        {cards.map((card, i) => {
          const open = flipped.includes(i) || matched.includes(card.pairId);
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              className={`memory-card ${open ? 'memory-card-open' : ''} ${gameOver ? 'memory-card-game-over' : ''}`}
              disabled={open || gameOver}
            >
              <img
                src={open ? card.imageUrl : CARD_BACK}
                alt={open ? card.name : "Card back"}
                className="memory-card-image"
              />
            </button>
          );
        })}
      </div>

      {/* Game over message */}
      {gameOver && (
        <div className="memory-game-over">
          <div className="memory-completion-card">
            <div className="memory-completion-title">🎉 Congratulations!</div>
            <div className="memory-completion-text">
              Completed in {time}s with {moves} moves!
            </div>
            <div className="memory-coins-earned">
              +{earnedCoins} coins earned!
            </div>
            <div className="memory-total-coins">
              Total coins: <span className="memory-total-coins-value">{user.totalPoints}</span>
            </div>
            
            {/* Show game message if exists */}
            {gameMessage && (
              <div className="memory-game-status">
                <p>{gameMessage}</p>
              </div>
            )}
            
            <div className="memory-next-play-info">
              <p>Come back tomorrow to play again!</p>
              <p className="memory-next-play-hint">Next play available: {nextPlayTime || "Calculating..."}</p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="memory-button"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STAT COMPONENT ---------------- */

function Stat({ icon, value, label }: any) {
  return (
    <div className="memory-stat-card">
      <div className="memory-stat-icon-container">{icon}</div>
      <div className="memory-stat-value">{value}</div>
      <div className="memory-stat-label">{label}</div>
    </div>
  );
}