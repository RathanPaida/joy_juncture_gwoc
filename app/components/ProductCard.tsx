"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, ShoppingCart, Users, Clock } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
  meta: {
    players: string;
    duration: string;
    age: string;
    badges?: string[];
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative flex flex-col bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300">

      {/* Image Area */}
      <div className="relative aspect-square overflow-hidden bg-zinc-900">
        <Link href={`/store/${product.slug}`} className="block h-full w-full">
          <img
            src={
              imageError
                ? "https://via.placeholder.com/600x800?text=GAME"
                : product.media.thumbnail
            }
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
            onError={() => setImageError(true)}
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          {/* Points/Value Badge - Mocked for now based on screenshot */}
          <div className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1">
            +{(product.price.amount * 10).toLocaleString()} JOY POINTS
          </div>
        </div>

        {/* Players Badge */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <div className="bg-black/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
            <Users size={12} className="text-white/70" />
            {product.meta.players} Players
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col gap-3">

        <div className="flex justify-between items-start gap-2">
          <Link href={`/store/${product.slug}`} className="group/title">
            <h2 className="text-lg font-bold text-white leading-tight group-hover/title:text-orange-500 transition-colors">
              {product.name}
            </h2>
          </Link>
          <span className="text-orange-500 font-bold text-lg">
            ${product.price.amount}
          </span>
        </div>

        <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed h-8">
          {product.shortDescription}
        </p>

        {/* Action Button */}
        <button className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-black font-bold uppercase text-[11px] tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95">
          <ShoppingCart size={14} />
          Add to Collection
        </button>
      </div>

    </div>
  );
}


