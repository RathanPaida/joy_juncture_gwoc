"use client";

import ZoneGameCard from "@/app/components/zone/ZoneGameCard";

export default function ZonePage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-4xl font-extrabold text-center mb-12">
        🎮 ZONE
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
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
