// app/components/ProductCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Users, Clock } from 'lucide-react';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    price: { amount: number; currency: string };
    media: { thumbnail: string };
    meta?: {
      players?: string;
      duration?: string;
      badges?: string[];
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white overflow-hidden transition-all duration-300"
      style={{
        boxShadow: isHovered
          ? '0 20px 40px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Image Container with Kinetic Hover Effect */}
      <Link href={`/store/${product.slug}`} className="block relative aspect-square overflow-hidden bg-black">
        <Image
          src={product.media.thumbnail}
          alt={product.name}
          fill
          className="object-cover transition-all duration-500"
          style={{
            filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        
        {/* NEW DROP Badge - Rotated */}
        {product.meta?.badges?.includes('new-drop') && (
          <div
            className="absolute top-4 right-4 bg-black text-white px-4 py-2 text-xs font-black tracking-widest z-10"
            style={{
              transform: 'rotate(-2deg)',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            NEW DROP
          </div>
        )}

        {/* Quick Add Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: 'rgba(0, 0, 0, 0.4)',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          <button
            className="flex items-center gap-2 px-6 py-3 text-white font-black text-sm tracking-wider transition-all duration-200"
            style={{
              backgroundColor: '#FF5F1F',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
              fontWeight: 900,
              transform: isHovered ? 'translateY(0) scale(1.03)' : 'translateY(10px) scale(1)',
            }}
            onClick={(e) => {
              e.preventDefault();
              console.log('Add to bag:', product._id);
            }}
          >
            <ShoppingBag size={18} strokeWidth={3} />
            ADD TO BAG
          </button>
        </div>
      </Link>

      {/* Info Section - Clean Typography */}
      <div className="p-4">
        <Link href={`/store/${product.slug}`}>
          <h3
            className="text-lg mb-3 line-clamp-2 transition-colors"
            style={{
              fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
              fontWeight: 800,
              color: isHovered ? '#FF5F1F' : '#000000',
              letterSpacing: '-0.02em',
            }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Price with Kinetic Jolt */}
        <div
          className="text-2xl mb-4"
          style={{
            fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
            fontWeight: 900,
            color: '#000000',
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {product.price.currency === 'INR' ? '₹' : '$'}{product.price.amount}
        </div>

        {/* Meta Info with Icons */}
        {product.meta && (
          <div className="flex items-center gap-4 text-sm">
            {product.meta.players && (
              <div className="flex items-center gap-1.5" style={{ color: '#666666' }}>
                <Users size={16} strokeWidth={2.5} style={{ color: '#FF5F1F' }} />
                <span style={{ fontFamily: '"Inter", -apple-system, sans-serif', fontWeight: 600 }}>
                  {product.meta.players}
                </span>
              </div>
            )}
            {product.meta.duration && (
              <div className="flex items-center gap-1.5" style={{ color: '#666666' }}>
                <Clock size={16} strokeWidth={2.5} style={{ color: '#FF5F1F' }} />
                <span style={{ fontFamily: '"Inter", -apple-system, sans-serif', fontWeight: 600 }}>
                  {product.meta.duration}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
