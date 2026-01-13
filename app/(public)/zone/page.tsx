"use client";

import ZoneGameCard from "@/app/components/zone/ZoneGameCard";
import "./zone-styles.css"; // Import the CSS file

export default function ZonePage() {
  return (
    <div className="zone-page">
      <h1 className="zone-header">
        🎮 ZONE
      </h1>

      <div className="zone-container">
        <ZoneGameCard
          title="Jigsaw Puzzle"
          description="Solve the puzzle as fast as you can"
          image="/games/jigsaw/preview.png"
          href="/games/jigsaw"
        />
                                                                                                                                    
        <ZoneGameCard
          title="Memory Game"
          description="Match cards and test your memory"
          image="/games/memory/preview.png"
          href="/games/memory"
        />
      </div>
    </div>
  );
}