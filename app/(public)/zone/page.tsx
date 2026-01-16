"use client";

import ZoneGameCard from "@/app/components/zone/ZoneGameCard";
import "./zone-styles.css";

export default function ZonePage() {
  const games = [
    {
      id: "jigsaw-puzzle",
      title: "Jigsaw Puzzle",
      description: "Solve the 4×4 puzzle of game images. Complete it to earn daily coins!",
      image: "/games/jigsaw-puzzle.jpg",
      category: "Puzzle",
      difficulty: "Medium",
      dailyLimit: true,
      coinReward: "50+ coins"
    },
    {
      id: "memory-game",
      title: "Memory Game",
      description: "Match cards and test your memory skills. Find all pairs to win!",
      image: "/games/memory-game.jpg",
      category: "Memory",
      difficulty: "Easy",
      dailyLimit: true,
      coinReward: "30+ coins"
    },
    {
      id: "sudoku",
      title: "Sudoku Challenge",
      description: "Fill the grid with numbers. Each puzzle has a unique solution.",
      image: "/games/sudoku.jpg",
      category: "Logic",
      difficulty: "Hard",
      dailyLimit: true,
      coinReward: "75+ coins"
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Classic 3-in-a-row game. Play against AI with three difficulty levels.",
      image: "/games/tictactoe.jpg",
      category: "Strategy",
      difficulty: "Easy",
      dailyLimit: false,
      coinReward: "20+ coins"
    },
    {
    id: "snake",
    title: "Snake Challenge",
    description: "Classic snake game. Eat food, grow longer, and avoid collisions!",
    image: "/games/snake.jpg",
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

      <div className="zone-stats-bar">
        <div className="zone-stat">
          <span className="zone-stat-number">{games.length}</span>
          <span className="zone-stat-label">Total Games</span>
        </div>
        <div className="zone-stat">
          <span className="zone-stat-number">{games.filter(g => g.dailyLimit).length}</span>
          <span className="zone-stat-label">Daily Games</span>
        </div>
        <div className="zone-stat">
          <span className="zone-stat-number">5</span>
          <span className="zone-stat-label">Categories</span>
        </div>
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