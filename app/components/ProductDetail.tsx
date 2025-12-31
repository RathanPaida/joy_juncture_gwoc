"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Share2, Plus, ArrowRight, ShieldCheck, Zap, Trophy } from "lucide-react";

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
  const [selectedImage, setSelectedImage] = useState(product.media.thumbnail);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  const handleThumbnailError = (img: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [img]: true }));
  };

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a] selection:bg-purple-100 font-sans">
      {/* 1. The Ghost Header */}
      <nav className="border-b border-zinc-100 py-6 px-8 lg:px-16">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex gap-4 text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold">
            <Link href="/" className="hover:text-black transition-all">Studio</Link>
            <span className="text-zinc-200">/</span>
            <Link href="/store" className="hover:text-black transition-all">Archive</Link>
            <span className="text-zinc-200">/</span>
            <span className="text-black italic font-serif tracking-widest">{product.name}</span>
          </div>
          <div className="text-[10px] tracking-[0.5em] font-black uppercase text-zinc-300">JJ Games © 2025</div>
        </div>
      </nav>

      <section className="max-w-screen-2xl mx-auto px-8 lg:px-16 py-12 lg:py-20">
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          
          {/* 2. Editorial Gallery - Balanced Height */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F6F6] group border border-zinc-50">
              <img
                src={mainImageError ? "https://via.placeholder.com/1200x900?text=No+Image" : selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-105"
                onError={() => setMainImageError(true)}
              />
              <div className="absolute bottom-8 left-8 mix-blend-difference text-white/50 text-[10px] tracking-[0.3em] uppercase">
                Product Image ref. {product._id.slice(-6)}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[product.media.thumbnail, ...product.media.images].map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-[4/3] cursor-pointer overflow-hidden transition-all duration-500 border ${selectedImage === img ? 'border-black' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img 
                    src={thumbnailErrors[img] ? "https://via.placeholder.com/200x150" : img} 
                    className="w-full h-full object-cover" 
                    alt=""
                    onError={() => handleThumbnailError(img)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. The Boutique Console - Approx 10cm Visual Height */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 flex flex-col border-l border-zinc-100 pl-12 min-h-[400px] justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.6em] text-zinc-400 font-black">{product.category[0]}</span>
                {product.meta.badges?.[0] && (
                  <span className="text-[8px] px-3 py-1 bg-black text-white font-bold tracking-[0.2em] uppercase">
                    {product.meta.badges[0].replace(/-/g, " ")}
                  </span>
                )}
              </div>
              
              <h1 className="text-5xl font-serif italic leading-[1.1] tracking-tighter text-black">{product.name}</h1>
              
              <p className="text-sm text-zinc-500 font-normal leading-relaxed border-l-2 border-purple-100 pl-6">
                {product.shortDescription}
              </p>

              {/* Specs Matrix */}
              <div className="grid grid-cols-2 gap-y-6 pt-4">
                {[
                  { label: "Format", value: product.meta.players },
                  { label: "Tempo", value: product.meta.duration },
                  { label: "Legacy", value: product.meta.age },
                  { label: "Skill", value: product.meta.difficulty },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-300 font-bold mb-1">{stat.label}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-800">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 pt-10">
              <div className="flex items-end gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-400 mb-1">Valuation</span>
                  <span className="text-4xl font-light tracking-tighter text-black">₹{product.price.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="pb-1">
                  <span className="text-[10px] text-purple-600 font-black tracking-widest uppercase bg-purple-50 px-3 py-1">
                    +{product.points.purchase} JJ Points
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="group relative w-full bg-black text-white h-16 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-zinc-900 transition-all flex items-center justify-center gap-4 active:scale-[0.98]">
                  <Plus size={14} /> Add to Collection
                  <div className="absolute top-0 right-0 w-1 h-1 bg-purple-500 group-hover:w-3 transition-all" />
                </button>
                <div className="flex gap-3">
                  <button className="flex-1 border border-zinc-200 h-14 flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all">
                    <Heart size={14} /> Wishlist
                  </button>
                  <button className="w-14 border border-zinc-200 h-14 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Narrative Reveal */}
      <section className="bg-[#0a0a0a] text-white py-32 overflow-hidden">
        <div className="max-w-3xl mx-auto px-8 relative">
          <span className="text-[9px] uppercase tracking-[1em] text-zinc-600 block text-center mb-16 font-bold">The Narrative</span>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif italic text-center leading-relaxed text-zinc-200 whitespace-pre-line">
              "{product.story}"
            </h2>
          </div>
          <div className="absolute -top-10 -left-10 text-[120px] font-serif text-white/5 select-none italic">"</div>
        </div>
      </section>

      {/* 5. The Methodology - Clean Sans Text */}
      <section className="max-w-screen-2xl mx-auto px-8 lg:px-16 py-32">
        <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-400 text-center mb-20 font-black italic underline underline-offset-[12px] decoration-zinc-100">Methodology</h2>
        <div className="grid lg:grid-cols-3 gap-12">
          {[
            { id: "01", title: "Configuration", content: product.howToPlay.setup, icon: <ShieldCheck size={20} strokeWidth={1}/> },
            { id: "02", title: "Execution", content: product.howToPlay.gameplay, icon: <Zap size={20} strokeWidth={1}/> },
            { id: "03", title: "Supremacy", content: product.howToPlay.winning, icon: <Trophy size={20} strokeWidth={1}/> },
          ].map((item, i) => (
            <div key={i} className="relative min-h-[320px] p-10 border border-zinc-100 flex flex-col group hover:border-black transition-all duration-700 bg-zinc-50/30">
              <div className="flex justify-between items-start mb-10">
                <span className="text-[40px] font-serif italic text-zinc-200 group-hover:text-purple-100 transition-colors leading-none">{item.id}</span>
                <span className="text-zinc-300 group-hover:text-black transition-colors">{item.icon}</span>
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b border-zinc-100 pb-4">{item.title}</h3>
              {/* Using a highly readable font weight and line height for instructions */}
              <p className="text-[13px] leading-[1.8] text-zinc-600 font-normal whitespace-pre-line flex-1">
                {item.content}
              </p>
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer Call to Action */}
      <section className="border-t border-zinc-100 py-32 px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center">
           <button className="flex items-center gap-10 text-5xl md:text-7xl font-serif italic hover:gap-16 transition-all group tracking-tighter">
             Ready to Play <ArrowRight size={64} className="text-purple-600 group-hover:text-black transition-transform group-hover:translate-x-4" strokeWidth={1} />
           </button>
           <div className="mt-16 flex gap-12 text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold">
             <span className="hover:text-black cursor-crosshair">In Stock</span>
             <span className="hover:text-black cursor-crosshair">Global Shipping</span>
             <span className="hover:text-black cursor-crosshair">Curated Quality</span>
           </div>
        </div>
      </section>
    </main>
  );
}