"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Heart } from "lucide-react";

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
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative flex flex-col bg-white">
      {/* The Gallery Frame */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F1F1F1]">
        <Link href={`/store/${product.slug}`} className="block h-full w-full">
          <img
            src={imageError ? "https://via.placeholder.com/600x800?text=COLLECTION" : product.media.thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[2000ms] cubic-bezier(0.25, 1, 0.5, 1) group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        </Link>

        {/* Minimalist Overlay - Appears only on hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Top Actions */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
          <span className="text-[8px] tracking-[0.4em] font-black uppercase bg-black text-white px-2 py-1">
            Limited
          </span>
          <button className="text-black/30 hover:text-black transition-colors duration-300">
            <Heart size={18} strokeWidth={1} />
          </button>
        </div>

        {/* Bottom Action - The "Slide-Up" Utility */}
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1)">
          <button className="w-full bg-white/90 backdrop-blur-md border border-black/5 py-4 text-[9px] font-bold uppercase tracking-[0.3em] text-black hover:bg-black hover:text-white transition-all duration-300 shadow-xl">
            <span className="flex items-center justify-center gap-2">
              <Plus size={12} strokeWidth={3} /> Add to Collection
            </span>
          </button>
        </div>
      </div>

      {/* Editorial Content Area */}
      <div className="mt-8 mb-4 flex flex-col items-center text-center px-4">
        {/* Collection Tag */}
        <span className="text-[8px] uppercase tracking-[0.5em] text-zinc-400 font-bold mb-3">
          Archive 2025
        </span>

        {/* Title - The Serif Hero */}
        <Link href={`/store/${product.slug}`} className="group/title">
          <h2 className="text-[17px] font-serif italic tracking-tight text-zinc-900 leading-tight">
            {product.name}
          </h2>
          <div className="h-px w-0 group-hover/title:w-full bg-zinc-200 transition-all duration-700 mx-auto mt-1" />
        </Link>
        
        {/* Price - Clean & Spaced */}
        <p className="mt-3 text-[13px] font-light tracking-[0.15em] text-zinc-800">
          ₹{product.price.amount.toLocaleString("en-IN")}
        </p>
        
        {/* Technical Stats - Revealed on hover */}
        <div className="mt-4 flex gap-6 opacity-0 group-hover:opacity-100 transition-all duration-1000 transform translate-y-2 group-hover:translate-y-0">
          <div className="flex flex-col">
            <span className="text-[7px] uppercase tracking-[0.3em] text-zinc-300 font-bold">Format</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{product.meta.players}</span>
          </div>
          <div className="w-px h-6 bg-zinc-100 mt-1" />
          <div className="flex flex-col">
            <span className="text-[7px] uppercase tracking-[0.3em] text-zinc-300 font-bold">Tempo</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{product.meta.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
