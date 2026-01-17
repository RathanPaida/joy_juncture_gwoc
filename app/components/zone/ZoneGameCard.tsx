"use client";

import Link from "next/link";
import "./zone-game-card.css";

interface ZoneGameCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
  category?: string;
  difficulty?: string;
  dailyLimit?: boolean;
  coinReward?: string;
}

export default function ZoneGameCard({
  title,
  description,
  image,
  href,
  category,
  difficulty,
  dailyLimit,
  coinReward,
}: ZoneGameCardProps) {
  return (
    <Link href={href} className="zone-card-link">
      <div className="zone-game-card">
        {/* Game Image */}
        <div className="game-image-container">
          <img
            src={image}
            alt={title}
            className="game-image"
          />
          {category && <div className="game-category-tag">{category}</div>}
          <div className="image-overlay"></div>
        </div>

        {/* Game Info */}
        <div className="game-info">
          <h2 className="game-title">
            {title}
          </h2>

          <p className="game-description">
            {description}
          </p>

          {/* Additional game stats */}
          {(difficulty || coinReward) && (
            <div className="game-stats">
              {difficulty && (
                <div className="game-stat">
                  <span className="stat-label">Difficulty:</span>
                  <span className={`stat-value difficulty-${difficulty.toLowerCase()}`}>
                    {difficulty}
                  </span>
                </div>
              )}
              {coinReward && (
                <div className="game-stat">
                  <span className="stat-label">Coins:</span>
                  <span className="stat-value coin-reward">{coinReward}</span>
                </div>
              )}
            </div>
          )}

          {/* Daily Limit Badge */}
          {dailyLimit && (
            <div className="daily-limit-badge">
              <span className="badge-text">DAILY PLAY</span>
            </div>
          )}

          <div className="play-button">
            Play Now
            <span className="button-arrow">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
