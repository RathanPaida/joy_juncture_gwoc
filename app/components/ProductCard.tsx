"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ShoppingCart, Users, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
  points?: { purchase: number };
  meta: {
    players: string;
    duration: string;
    age: string;
    badges?: string[];
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const points = product.points?.purchase || 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if clicked within Link context
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    setAddingToCart(true);

    try {
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          productSlug: product.slug,
          name: product.name,
          price: product.price.amount,
          quantity: 1,
          image: product.media.thumbnail,
          points: points
        }),
      });

      if (res.ok) {
        alert("Added to cart!");
        // Optional: trigger global cart update or toast
      } else {
        alert("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Something went wrong");
    } finally {
      setAddingToCart(false);
    }
  };

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
          {/* Points/Value Badge */}
          <div className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1">
            +{points.toLocaleString()} JOY POINTS
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
        <button
          className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-bold uppercase text-[11px] tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:active:scale-100"
          onClick={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ShoppingCart size={14} />
          )}
          {addingToCart ? "Adding..." : "Add to Cart"}
        </button>
      </div>

    </div>
  );
}


