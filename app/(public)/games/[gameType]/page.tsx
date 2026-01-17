"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Loader2, Gamepad2 } from "lucide-react";
import dynamic from 'next/dynamic';

// Import game components dynamically for better performance
const JigsawPuzzleGame = dynamic(() => import("@/app/components/games/JigsawPuzzleGame"), {
  loading: () => <GameLoading />
});

const MemoryGame = dynamic(() => import("@/app/components/games/MemoryGame"), {
  loading: () => <GameLoading />
});

const SudokuGame = dynamic(() => import("@/app/components/games/SudokuGame"), {
  loading: () => <GameLoading />
});

const WordGuesserGame = dynamic(() => import("@/app/components/games/WordGuesserGame"), {
  loading: () => <GameLoading />
});

const CrosswordGame = dynamic(() => import("@/app/components/games/CrosswordGame"), {
  loading: () => <GameLoading />
});

const TriviaGame = dynamic(() => import("@/app/components/games/TriviaGame"), {
  loading: () => <GameLoading />
});

const TicTacToeGame = dynamic(() => import("@/app/components/games/TicTacToeGame"), {
  loading: () => <GameLoading />
});

const SnakeGame = dynamic(() => import("@/app/components/games/SnakeGame"), {
  loading: () => <GameLoading />
});

const QuizGame = dynamic(() => import("@/app/components/games/QuizGame"), {
  loading: () => <GameLoading />
});

// Loading component
function GameLoading() {
  return (
    <div className="game-loading">
      <Loader2 className="animate-spin" size={48} color="#ff6600" />
      <p className="game-loading-text">Loading game...</p>
    </div>
  );
}

// Game not found component
function GameNotFound({ gameType }: { gameType: string }) {
  const router = useRouter();
  
  return (
    <div className="game-not-found">
      <div className="game-not-found-content">
        <div className="game-not-found-icon">🎮</div>
        <h1 className="game-not-found-title">Game Not Found</h1>
        <p className="game-not-found-message">
          The game "<span className="highlight">{gameType}</span>" doesn't exist or is not available yet.
        </p>
        <div className="game-not-found-buttons">
          <button
            onClick={() => router.push("/zone")}
            className="back-button"
          >
            <ArrowLeft size={18} />
            Back to Game Zone
          </button>
          <button
            onClick={() => router.push("/")}
            className="home-button"
          >
            <Gamepad2 size={18} />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Game components mapping - ADDED SNAKE GAME HERE
const gameComponents: Record<string, React.ComponentType> = {
  "jigsaw-puzzle": JigsawPuzzleGame,
  "memory-game": MemoryGame,
  "sudoku": SudokuGame,
  "tictactoe": TicTacToeGame,
  "snake": SnakeGame, // ADD THIS LINE
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gameExists, setGameExists] = useState(false);

  const gameType = params.gameType as string;

  useEffect(() => {
    // Debug log to check the parameter
    console.log("Route params:", params);
    console.log("Game Type from params:", gameType);
    
    // Check if game exists
    if (gameType && gameComponents[gameType]) {
      console.log(`Game "${gameType}" found in mapping`);
      setGameExists(true);
    } else {
      console.log(`Game "${gameType}" NOT found in mapping`);
    }
    setLoading(false);
  }, [gameType]);

  if (loading) {
    return (
      <div className="game-page-container">
        <GameLoading />
      </div>
    );
  }

  if (!gameType || !gameExists) {
    return (
      <div className="game-page-container">
        <button
          onClick={() => router.push("/zone")}
          className="floating-back-button"
        >
          <ArrowLeft size={16} />
          Back to Zone
        </button>
        <GameNotFound gameType={gameType || "unknown"} />
      </div>
    );
  }

  const GameComponent = gameComponents[gameType];

  return (
    <div className="game-page-container">
      <button
        onClick={() => router.push("/zone")}
        className="floating-back-button"
      >
        <ArrowLeft size={16} />
        Back to Zone
      </button>
      
      <Suspense fallback={<GameLoading />}>
        <GameComponent />
      </Suspense>
    </div>
  );
}