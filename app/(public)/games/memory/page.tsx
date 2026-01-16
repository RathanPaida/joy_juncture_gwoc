"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, RefreshCw, Trophy, Gamepad2 } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./memory-game.css";

/* ---------------- TYPES ---------------- */

interface User {
  _id: string;
  name: string;
  userPoints: number;
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

  const CARD_BACK =
    "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png";

  /* ---------------- GET TOKEN HELPER ---------------- */
  const getIdToken = async (): Promise<string | null> => {
    try {
      // Get Firebase Auth instance and current user
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
    if (games.length === 0) return;

    // Select exactly 8 unique games for 8 pairs (16 cards total)
    let selected = [...games];
    
    // If we have fewer than 8 games, keep duplicating until we have at least 8
    while (selected.length < 8) {
      selected = [...selected, ...games];
    }
    
    // Shuffle and take exactly the first 8 games
    const shuffled = selected.sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 8);

    // Create pairs for each of the 8 chosen games (total 16 cards)
    const preparedCards: GameCard[] = chosen.flatMap((g) => [
      { id: `${g.id}-a`, pairId: g.id, name: g.name, imageUrl: g.imageUrl },
      { id: `${g.id}-b`, pairId: g.id, name: g.name, imageUrl: g.imageUrl }
    ]);

    // Shuffle the cards
    setCards(preparedCards.sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTime(0);
    setGameStarted(false);
    setGameOver(false);
    setEarnedCoins(0);
  }, [games]);

  useEffect(() => {
    if (games.length) initializeGame();
  }, [games, initializeGame]);

  /* ---------------- GAME LOGIC ---------------- */

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || gameOver) return;

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
    setEarnedCoins(coins);

    if (!user) {
      console.error("❌ No user found when finishing game");
      return;
    }

    console.log("🎮 Game finished! Attempting to add coins:", { 
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
            <div className="memory-coins-value">{user.userPoints}</div>
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
        <Stat value={user.userPoints} label="Coins" />
      </div>

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
              Total coins: <span className="memory-total-coins-value">{user.userPoints}</span>
            </div>
          </div>
        </div>
      )}

      {/* Game controls */}
      <div className="memory-controls">
        <button
          onClick={initializeGame}
          className="memory-button"
        >
          {gameOver ? "Play Again" : "Restart Game"}
        </button>
      </div>
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