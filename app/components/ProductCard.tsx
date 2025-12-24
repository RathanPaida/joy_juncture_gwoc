"use client";

import Link from "next/link";
import { useState } from "react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/store/${product.slug}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative overflow-hidden bg-gray-200 h-48">
        <img
          src={imageError ? "https://via.placeholder.com/300x200?text=No+Image" : product.media.thumbnail}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-1 group-hover:text-purple-600 transition">
          {product.name}
        </h2>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.shortDescription}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-purple-600">
            ₹{product.price.amount.toLocaleString("en-IN")}
          </p>
          <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition">
            View
          </button>
        </div>
      </div>
    </Link>
  );
}
