"use client";

import { useState } from "react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string;
  price: { amount: number; currency: string };
  points: { purchase: number };
  media: {
    thumbnail: string;
    images: string[];
    video?: { url: string; provider: string };
  };
  meta: {
    players: string;
    duration: string;
    age: string;
    difficulty: string;
    badges: string[];
    moods: string[];
  };
  howToPlay: {
    setup: string;
    gameplay: string;
    winning: string;
  };
  category: string[];
}

export default function ProductDetail({ product }: { product: Product }) {
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  const handleMainImageError = () => setMainImageError(true);
  const handleThumbnailError = (img: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [img]: true }));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600">
              Home
            </Link>
            <span>/</span>
            <Link href="/store" className="hover:text-purple-600">
              Store
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Images */}
          <div>
            <div className="mb-4 rounded-lg overflow-hidden bg-gray-200 h-96">
              <img
                src={
                  mainImageError
                    ? "https://via.placeholder.com/500x400?text=No+Image"
                    : product.media.thumbnail
                }
                alt={product.name}
                className="w-full h-full object-cover"
                onError={handleMainImageError}
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.media.images && product.media.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.media.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={
                      thumbnailErrors[img]
                        ? "https://via.placeholder.com/100x100"
                        : img
                    }
                    alt={`${product.name} ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-75 transition"
                    onError={() => handleThumbnailError(img)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Title & Description */}
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 text-lg mb-4">
              {product.shortDescription}
            </p>

            {/* Badges */}
            {product.meta.badges && product.meta.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.meta.badges.map((badge) => (
                  <span
                    key={badge}
                    className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium"
                  >
                    {badge.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Price & Points */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-3xl font-bold text-purple-600 mb-2">
                ₹{product.price.amount.toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-purple-700">
                🎁 Earn +{product.points.purchase} JJ Points on this purchase
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button className="flex-1 px-4 py-3 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition">
                🛒 Add to Cart
              </button>
              <button className="flex-1 px-4 py-3 rounded border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 transition">
                ❤️ Wishlist
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Players
                </p>
                <p className="text-lg font-semibold">{product.meta.players}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Duration
                </p>
                <p className="text-lg font-semibold">
                  {product.meta.duration}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Age
                </p>
                <p className="text-lg font-semibold">{product.meta.age}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Difficulty
                </p>
                <p className="text-lg font-semibold">
                  {product.meta.difficulty}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-white border-t py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">
            What is {product.name}?
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {product.story}
          </p>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">How to Play</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">🎲 Setup</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {product.howToPlay.setup}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">⚔️ Gameplay</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {product.howToPlay.gameplay}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">🏆 Winning</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {product.howToPlay.winning}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
