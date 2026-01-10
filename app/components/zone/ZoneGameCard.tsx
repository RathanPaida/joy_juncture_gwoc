"use client";

import Link from "next/link";

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
              →
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}
