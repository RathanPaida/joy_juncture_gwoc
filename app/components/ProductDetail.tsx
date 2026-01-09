"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Share2, Plus, ArrowRight, ShieldCheck, Zap, Trophy, ChevronDown, Package, Sparkles } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string;
  price: { amount: number; currency: string };
  points?: { purchase: number }; // Made optional
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
  keyFeatures?: string[];
  whatYouGet?: string[];
  faqs?: { question: string; answer: string }[];
  category: string[];
}

export default function ProductDetail({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(product.media.thumbnail);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleThumbnailError = (img: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [img]: true }));
  };

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a] selection:bg-purple-100 font-sans">
      {/* The Ghost Header */}
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
          
          {/* Editorial Gallery - Balanced Height */}
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

          {/* The Boutique Console */}
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
                {product.points?.purchase !== undefined && (
                  <div className="pb-1">
                    <span className="text-[10px] text-purple-600 font-black tracking-widest uppercase bg-purple-50 px-3 py-1">
                      +{product.points.purchase} JJ Points
                    </span>
                  </div>
                )}
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

      {/* The Narrative Reveal */}
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

      {/* Key Features Section */}
      {product.keyFeatures && product.keyFeatures.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-8 lg:px-16 py-32 bg-zinc-50/50">
          <div className="flex items-center justify-center gap-4 mb-20">
            <Sparkles size={20} className="text-purple-600" strokeWidth={1} />
            <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-400 text-center font-black">Why You'll Love It</h2>
            <Sparkles size={20} className="text-purple-600" strokeWidth={1} />
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {product.keyFeatures.map((feature, idx) => (
              <div key={idx} className="p-10 border border-zinc-200 hover:border-black transition-all group relative bg-white">
                <div className="absolute top-6 left-6 text-[40px] font-serif italic text-zinc-100 group-hover:text-purple-50 transition-colors leading-none">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 group-hover:text-black transition-colors mt-16">
                  {feature}
                </p>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-purple-600 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The Methodology */}
      <section className="max-w-screen-2xl mx-auto px-8 lg:px-16 py-32">
        <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-400 text-center mb-20 font-black italic underline underline-offset-[12px] decoration-zinc-100">How to Play</h2>
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
              <p className="text-[13px] leading-[1.8] text-zinc-600 font-normal whitespace-pre-line flex-1">
                {item.content}
              </p>
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-700" />
            </div>
          ))}
        </div>
      </section>

        {/* What You Get Section */}
      {product.whatYouGet && product.whatYouGet.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-8 lg:px-16 py-32 border-t border-zinc-100">
          <div className="flex items-center justify-center gap-4 mb-20">
            <Package size={20} className="text-purple-600" strokeWidth={1} />
            <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-400 text-center font-black">What's in the Box</h2>
            <Package size={20} className="text-purple-600" strokeWidth={1} />
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {product.whatYouGet.map((item, idx) => (
              <div key={idx} className="flex items-start gap-5 p-8 border border-zinc-100 hover:border-zinc-300 transition-all group bg-white">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <span className="text-xs font-bold text-purple-600">{idx + 1}</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed group-hover:text-black transition-colors pt-2">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {product.faqs && product.faqs.length > 0 && (
        <section className="bg-zinc-50 py-32 px-8 border-y border-zinc-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif italic text-center mb-6">Got Doubts? Let's Dare You to Ask!</h2>
            <p className="text-center text-sm text-zinc-500 mb-16 uppercase tracking-[0.3em]">Decode the Deck</p>
            <div className="space-y-4">
              {product.faqs.map((faq, idx) => (
                <div key={idx} className="bg-white border border-zinc-200 overflow-hidden transition-all hover:border-black">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-8 flex justify-between items-center hover:bg-zinc-50 transition-all text-left"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-black pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      size={20} 
                      strokeWidth={1.5}
                      className={`flex-shrink-0 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaqIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-8 pb-8 pt-2 border-t border-zinc-100">
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer Call to Action */}
      <section className="border-t border-zinc-100 py-32 px-8 bg-white">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center">
          <button className="flex items-center gap-10 text-5xl md:text-7xl font-serif italic hover:gap-16 transition-all group tracking-tighter">
            Ready to Play <ArrowRight size={64} className="text-purple-600 group-hover:text-black transition-transform group-hover:translate-x-4" strokeWidth={1} />
          </button>
          <div className="mt-16 flex gap-12 text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold">
            <span className="hover:text-black cursor-crosshair transition-colors">In Stock</span>
            <span className="hover:text-black cursor-crosshair transition-colors">Global Shipping</span>
            <span className="hover:text-black cursor-crosshair transition-colors">Curated Quality</span>
          </div>
        </div>
      </section>
    </main>
  );
}
