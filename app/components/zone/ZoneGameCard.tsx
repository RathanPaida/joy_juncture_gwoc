
"use client";

import Link from "next/link";
import "./zone-game-card.css";

interface ZoneGameCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
}

export default function ZoneGameCard({
  title,
  description,
  image,
  href,
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