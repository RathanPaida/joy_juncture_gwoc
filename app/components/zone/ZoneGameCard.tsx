<<<<<<< HEAD
"use client";

import Link from "next/link";
=======

"use client";

import Link from "next/link";
import "./zone-game-card.css";
>>>>>>> f760212efab5e20c7029cfdd8713f8935d651838

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
<<<<<<< HEAD
    <Link href={href} className="block">
      <div className="group bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

        {/* Game Image */}
        <div className="h-52 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Game Info */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            {title}
          </h2>

          <p className="text-gray-600 mb-4">
            {description}
          </p>

          <div className="inline-flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl">
            Play Now
            <span className="transition-transform group-hover:translate-x-1">
=======
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
>>>>>>> f760212efab5e20c7029cfdd8713f8935d651838
              →
            </span>
          </div>
        </div>
<<<<<<< HEAD

      </div>
    </Link>
  );
}
=======
      </div>
    </Link>
  );
}
>>>>>>> f760212efab5e20c7029cfdd8713f8935d651838
