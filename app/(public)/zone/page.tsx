
"use client";

import ZoneGameCard from "@/app/components/zone/ZoneGameCard";
import "./zone-styles.css";

export default function ZonePage() {
  const games = [
    {
      id: "jigsaw-puzzle",
      title: "Jigsaw Puzzle",
      description: "Solve the 4×4 puzzle of game images. Complete it to earn daily coins!",
      image: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1768660916/Screenshot_2026-01-17_at_8.11.20_PM_ws5uev.png",
      category: "Puzzle",
      difficulty: "Medium",
      dailyLimit: true,
      coinReward: "50+ coins"
    },
    {
      id: "memory-game",
      title: "Memory Game",
      description: "Match cards and test your memory skills. Find all pairs to win!",
      image: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1768079331/dc2584c1-4eb3-43cf-98da-25bfdc79e498.png",
      category: "Memory",
      difficulty: "Easy",
      dailyLimit: true,
      coinReward: "30+ coins"
    },
    {
      id: "sudoku",
      title: "Sudoku Challenge",
      description: "Fill the grid with numbers. Each puzzle has a unique solution.",
      image: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1768660995/sudko_bh59wu.jpg",
      category: "Logic",
      difficulty: "Hard",
      dailyLimit: true,
      coinReward: "75+ coins"
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Classic 3-in-a-row game. Play against AI with three difficulty levels.",
      image: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1768661128/tic_cfiwvn.png",
      category: "Strategy",
      difficulty: "Easy",
      dailyLimit: false,
      coinReward: "20+ coins"
    },
    {
    id: "snake",
    title: "Snake Challenge",
    description: "Classic snake game. Eat food, grow longer, and avoid collisions!",
    image: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1768661207/snake_kewvjm.png",
    category: "Arcade",
    difficulty: "Medium",
    dailyLimit: true,
    coinReward: "40+ coins"
  },
    
  ];

  return (
    <div className="zone-page">
      <div className="zone-header-section">
        <h1 className="zone-header">🎮 GAME ZONE</h1>
        <p className="zone-subtitle">
          Play exciting games and earn coins daily! Each game can be played once per day.
        </p>
      </div>

      

      <div className="zone-games-grid">
        {games.map((game) => (
          <ZoneGameCard
            key={game.id}
            title={game.title}
            description={game.description}
            image={game.image}
            href={`/games/${game.id}`} // ADD THIS LINE - THIS IS WHAT WAS MISSING
          />
        ))}
      </div>

      <div className="zone-footer">
        <p className="zone-footer-text">
          💡 <strong>How it works:</strong> Play each game once daily to earn coins. 
          Higher difficulty = More coins! Come back every day for new challenges.
        </p>
      </div>
    </div>
  );
}
