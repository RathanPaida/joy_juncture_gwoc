"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Share2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trophy,
  ChevronDown,
  Package,
  Sparkles,
  ShoppingCart,
  Check,
  LogIn,
  X,
  Minus,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string;
  price: { amount: number; currency: string };
  points?: { purchase: number };
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
  stock?: number;
}

export default function ProductDetail({ product }: { product: Product }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState(product.media.thumbnail);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>(
    {}
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Quantity state
  const [quantity, setQuantity] = useState(1);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [tempQuantity, setTempQuantity] = useState("1");
  const maxStock = product.stock || 0;

  const handleThumbnailError = (img: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [img]: true }));
  };

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (!newQuantity) return;
    setQuantity(newQuantity);
  };

  // Handle direct quantity input
  const handleQuantityInput = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setTempQuantity(value);
    }
  };

  const handleQuantityBlur = () => {
    const num = parseInt(tempQuantity);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
      setTempQuantity("1");
    } else if (num > maxStock) {
      setQuantity(maxStock);
      setTempQuantity(maxStock.toString());
    } else {
      setQuantity(num);
      setTempQuantity(num.toString());
    }
    setIsEditingQuantity(false);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleQuantityBlur();
    } else if (e.key === "Escape") {
      setTempQuantity(quantity.toString());
      setIsEditingQuantity(false);
    }
  };

  const handleAddToCart = async () => {
    setCartError(null);

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (quantity > maxStock) {
      setCartError(`Only ${maxStock} items available in stock`);
      setTimeout(() => setCartError(null), 5000);
      return;
    }

    if (maxStock === 0 || !product.stock) {
      setCartError("This product is currently out of stock");
      setTimeout(() => setCartError(null), 5000);
      return;
    }

    setIsAddingToCart(true);
    setIsAddedToCart(false);

    try {
      const token = await getAuthToken();

      if (!token) {
        setCartError("Unable to authenticate. Please login again.");
        setTimeout(() => setCartError(null), 5000);
        setIsAddingToCart(false);
        return;
      }

      const response = await fetch("/api/cart", {
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
          quantity: quantity,
          image: product.media.thumbnail,
          points: product.points?.purchase || 0,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (response.ok) {
        setIsAddedToCart(true);
        setCartCount(data.count || cartCount + 1);
        setShowSuccessMessage(true);
        setRetryCount(0);

        setTimeout(() => {
          setShowSuccessMessage(false);
          setIsAddedToCart(false);
          setQuantity(1);
          setTempQuantity("1");
        }, 3000);
      } else {
        if (response.status === 401 && retryCount < 2) {
          setRetryCount((prev) => prev + 1);
          const currentUser = auth.currentUser;
          if (currentUser) {
            const freshToken = await currentUser.getIdToken(true);
            if (freshToken) {
              setTimeout(() => handleAddToCart(), 500);
              return;
            }
          }
        }

        setCartError(data.error || `Failed to add to cart (${response.status})`);
        setTimeout(() => setCartError(null), 5000);
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      setCartError(error.message || "Network error. Please try again.");
      setTimeout(() => setCartError(null), 5000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const updateCartCount = async () => {
    if (!user) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/cart/count", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response from cart count");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setCartCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  useEffect(() => {
    if (user) updateCartCount();
  }, [user]);

  const handleLoginRedirect = () => {
    router.push(`/login?redirect=/products/${product.slug}`);
    setShowLoginPrompt(false);
  };

  const handleContinueShopping = () => {
    setShowLoginPrompt(false);
  };

  // Success Message Component (dark theme)
  const SuccessMessage = () => (
    <div className="fixed top-24 right-8 z-50 animate-slide-in">
      <div className="bg-[#060606] border border-emerald-500/40 rounded-xl p-4 shadow-[0_18px_45px_rgba(0,0,0,0.85)] max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-100">
              Added to cart successfully!
            </p>
            <p className="text-xs text-emerald-300 mt-1">
              {quantity} × "{product.name}" added to your collection
            </p>
            <div className="flex gap-3 mt-3">
              <Link
                href="/cart"
                className="text-xs font-bold text-emerald-300 hover:text-emerald-100 underline"
              >
                View Cart
              </Link>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-xs text-emerald-300 hover:text-emerald-100"
              >
                Continue Shopping
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // Error Message Component (dark theme)
  const ErrorMessage = () => (
    <div className="fixed top-24 right-8 z-50 animate-slide-in">
      <div className="bg-[#060606] border border-red-500/40 rounded-xl p-4 shadow-[0_18px_45px_rgba(0,0,0,0.85)] max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-100">
              Unable to add to cart
            </p>
            <p className="text-xs text-red-300 mt-1">{cartError}</p>
            {cartError?.includes("login") && (
              <button
                onClick={handleLoginRedirect}
                className="mt-2 text-xs font-bold text-red-300 hover:text-red-100 underline"
              >
                Login & Retry
              </button>
            )}
            <div className="mt-3">
              <button
                onClick={() => setCartError(null)}
                className="text-xs font-bold text-red-300 hover:text-red-100 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setCartError(null)}
            className="text-red-400 hover:text-red-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // Login Prompt Modal Component (dark shell)
  const LoginPromptModal = () => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#070707] rounded-2xl p-8 max-w-md w-full border border-zinc-800 shadow-[0_24px_70px_rgba(0,0,0,0.95)]">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-serif italic text-white">
            Sign in to continue
          </h3>
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-zinc-300 text-sm leading-relaxed">
            You need to be signed in to add items to your collection. Sign in or
            create an account to continue shopping and earn JJ Points.
          </p>

          <div className="bg-[#1b1207] border border-[#FF6B00]/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FF6B00] text-xs font-bold">i</span>
              </div>
              <p className="text-xs text-[#FFD7A8]">
                Earn{" "}
                <span className="font-bold text-[#FFB062]">
                  +{(product.points?.purchase || 0) * quantity} JJ Points
                </span>{" "}
                with this purchase!
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={handleLoginRedirect}
            className="w-full bg-[#FF6B00] text-black h-14 text-sm font-bold uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-3 rounded-xl active:scale-[0.99]"
          >
            <LogIn size={16} /> Sign In to Continue
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleContinueShopping}
              className="flex-1 border border-zinc-700 h-12 text-xs font-bold uppercase tracking-wider hover:bg-[#101010] text-zinc-300 hover:text-white transition-all rounded-xl"
            >
              Continue Browsing
            </button>
            <Link
              href="/signup"
              className="flex-1 border border-[#FF6B00] h-12 text-xs font-bold uppercase tracking-wider hover:bg-[#FF6B00] hover:text-black transition-all rounded-xl flex items-center justify-center text-[#FFB062]"
            >
              Create Account
            </Link>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-8 text-center pt-6 border-t border-zinc-800">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-zinc-300 underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-zinc-300 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );

  const getButtonText = () => {
    if (authLoading) return "Checking...";
    if (isAddingToCart) return "Adding...";
    if (isAddedToCart) return "Added to Cart!";
    return `Add ${quantity > 1 ? quantity : ""} to Collection`.trim();
  };

  const getButtonIcon = () => {
    if (authLoading || isAddingToCart)
      return (
        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin bg-transparent" />
      );
    if (isAddedToCart) return <Check size={14} />;
    return <ShoppingCart size={14} />;
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans relative">
      {showSuccessMessage && <SuccessMessage />}
      {cartError && <ErrorMessage />}
      {showLoginPrompt && <LoginPromptModal />}

      {/* Ghost Header / Breadcrumbs */}
      <nav className="border-b border-zinc-900 py-6 px-4 lg:px-10 sticky top-0 bg-[#050505]/95 backdrop-blur-sm z-40">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex gap-4 text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-bold">
            <Link href="/" className="hover:text-white transition-all">
              Studio
            </Link>
            <span className="text-zinc-600">/</span>
            <Link href="/store" className="hover:text-white transition-all">
              Archive
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-white italic font-serif tracking-widest">
              {product.name}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-[10px] tracking-[0.3em] font-bold uppercase hover:text-white transition-colors text-zinc-400 group"
            >
              <ShoppingBag
                size={14}
                className="group-hover:scale-110 transition-transform"
              />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF6B00] text-black text-[8px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="text-[10px] tracking-[0.5em] font-black uppercase text-zinc-600">
              JJ Games © 2025
            </div>
          </div>
        </div>
      </nav>

      {/* Above the fold: gallery + details */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-10 pt-10 pb-20">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.9fr] items-start">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-[#111111] border border-zinc-900 shadow-[0_24px_70px_rgba(0,0,0,0.9)]">
              <div className="relative aspect-[4/5]">
                <img
                  src={
                    mainImageError
                      ? "https://via.placeholder.com/1200x900?text=No+Image"
                      : selectedImage
                  }
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105 hover:rotate-[0.5deg]"
                  onError={() => setMainImageError(true)}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="pointer-events-none absolute -bottom-16 right-[-30%] h-48 w-48 rounded-full bg-[#FF6B00]/40 blur-3xl opacity-80" />

                <div className="absolute bottom-6 left-6 text-[9px] tracking-[0.35em] uppercase text-zinc-300">
                  Product ref. {product._id.slice(-6)}
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-3 p-4 border-t border-zinc-900 bg-[#0A0A0A]/90 backdrop-blur-md">
                {[product.media.thumbnail, ...(product.media.images || [])].map(
                  (img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative aspect-square w-16 rounded-2xl overflow-hidden border transition-all ${
                        selectedImage === img
                          ? "border-[#FF6B00] opacity-100"
                          : "border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-500"
                      }`}
                    >
                      <img
                        src={
                          thumbnailErrors[img]
                            ? "https://via.placeholder.com/200x200?text=IMG"
                            : img
                        }
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => handleThumbnailError(img)}
                      />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:sticky lg:top-28 flex flex-col min-h-[400px] justify-between border-l border-zinc-900 pl-0 lg:pl-10">
            <div className="space-y-8">
              {/* badges row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-[0.35em]">
                  <span className="px-3 py-1 rounded-full bg-[#101010] border border-zinc-800 text-zinc-400">
                    {product.category[0]}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#101010] border border-[#FF6B00]/40 text-[#FFB062]">
                    {product.meta.age}+ Years
                  </span>
                  {product.meta.badges?.[0] && (
                    <span className="px-3 py-1 rounded-full bg-[#FF6B00] text-black tracking-[0.25em]">
                      {product.meta.badges[0].replace(/-/g, " ")}
                    </span>
                  )}
                </div>
                <span className="text-[9px] uppercase tracking-[0.35em] text-zinc-500">
                  {product.meta.difficulty}
                </span>
              </div>

              {/* title + short description */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                  {product.name}
                </h1>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {product.shortDescription}
                </p>
                <div className="h-px w-24 bg-gradient-to-r from-[#FF6B00] via-[#FF9A4D] to-transparent" />
              </div>

              {/* specs matrix */}
              <div className="grid grid-cols-2 gap-y-5 pt-2">
                {[
                  { label: "Format", value: product.meta.players },
                  { label: "Tempo", value: product.meta.duration },
                  { label: "Legacy", value: product.meta.age },
                  { label: "Skill", value: product.meta.difficulty },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">
                      {stat.label}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-200">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* price + points */}
              <div className="flex items-end gap-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.35em] text-zinc-500 mb-1">
                    Valuation
                  </span>
                  <span className="text-3xl md:text-4xl font-black tracking-tight">
                    ₹{(product.price.amount * quantity).toLocaleString("en-IN")}
                  </span>
                  {quantity > 1 && (
                    <span className="text-xs text-zinc-500 mt-1">
                      ₹{product.price.amount.toLocaleString("en-IN")} × {quantity}
                    </span>
                  )}
                </div>
                {product.points?.purchase !== undefined && (
                  <div className="pb-1">
                    <span className="text-[10px] text-[#FFB062] font-black tracking-widest uppercase bg-[#2b1a07] px-3 py-1 rounded-full border border-[#FF6B00]/40">
                      +{product.points.purchase * quantity} JJ Points
                    </span>
                  </div>
                )}
              </div>

              {/* quantity + CTA */}
              <div className="space-y-6">
                {/* Quantity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.35em] text-zinc-500 font-bold">
                      Quantity
                    </span>
                    {maxStock <= 10 && maxStock > 0 && (
                      <span className="text-[8px] uppercase tracking-wider text-[#FFB062] font-bold bg-[#2b1a07] px-2 py-1 rounded">
                        Only {maxStock} left
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#0A0A0A] border border-zinc-800 rounded-full px-3 py-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuantityChange(-1);
                        }}
                        disabled={quantity <= 1}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <div
                        className="px-3 cursor-pointer"
                        onClick={() => {
                          setIsEditingQuantity(true);
                          setTempQuantity(quantity.toString());
                        }}
                      >
                        {isEditingQuantity ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tempQuantity}
                            onChange={(e) => handleQuantityInput(e.target.value)}
                            onBlur={handleQuantityBlur}
                            onKeyDown={handleQuantityKeyDown}
                            className="w-10 bg-transparent text-center text-sm text-white outline-none"
                            autoFocus
                            maxLength={3}
                          />
                        ) : (
                          <span className="text-lg font-semibold">
                            {quantity}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuantityChange(1);
                        }}
                        disabled={maxStock > 0 && quantity >= maxStock}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    {maxStock > 0 && (
                      <span className="text-[10px] text-zinc-500">
                        {maxStock} in archive
                      </span>
                    )}
                    {maxStock === 0 && (
                      <span className="text-[10px] text-red-400">
                        Currently out of stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to cart button */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      isAddingToCart ||
                      isAddedToCart ||
                      authLoading ||
                      maxStock === 0
                    }
                    className={`group relative w-full h-14 text-[10px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 rounded-full active:scale-[0.98] shadow-[0_18px_35px_rgba(0,0,0,0.9)] ${
                      maxStock === 0
                        ? "bg-zinc-700 text-zinc-300 cursor-not-allowed"
                        : isAddedToCart
                        ? "bg-emerald-500 text-black cursor-default"
                        : "bg-[#FF6B00] text-black hover:bg-white"
                    }`}
                  >
                    {getButtonIcon()}
                    {maxStock === 0 ? "Out of Stock" : getButtonText()}
                    <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[#FF6B00]/40 group-hover:ring-2 group-hover:ring-white/30 transition-all" />
                  </button>

                  <div className="flex gap-3">
                    <button className="flex-1 border border-zinc-800 h-11 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.35em] bg-[#101010] text-zinc-300 hover:border-[#FF6B00] hover:text-white transition-all rounded-full group">
                      <Heart
                        size={14}
                        className="text-zinc-400 group-hover:text-[#FF6B00] transition-colors"
                      />{" "}
                      Wishlist
                    </button>
                    <button className="w-11 border border-zinc-800 h-11 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#FF6B00] bg-[#101010] transition-all rounded-full">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* moods row */}
            {product.meta.moods?.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                {product.meta.moods.map((mood) => (
                  <span
                    key={mood}
                    className="px-3 py-1 rounded-full bg-[#0A0A0A] border border-zinc-800"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Narrative */}
      <section className="bg-[#050505] text-white py-32 overflow-hidden border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 relative">
          <span className="text-[9px] uppercase tracking-[1em] text-zinc-600 block text-center mb-14 font-bold">
            The Narrative
          </span>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif italic text-center leading-relaxed text-zinc-100 whitespace-pre-line">
              "{product.story}"
            </h2>
          </div>
          <div className="absolute -top-10 -left-6 text-[140px] font-serif text-white/5 select-none italic">
            "
          </div>
        </div>
      </section>

      {/* Key Features */}
      {product.keyFeatures && product.keyFeatures.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 bg-[#070707] border-t border-zinc-900">
          <div className="flex items-center justify-center gap-4 mb-16">
            <Sparkles size={20} className="text-[#FF6B00]" strokeWidth={1} />
            <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-500 text-center font-black">
              Why You'll Love It
            </h2>
            <Sparkles size={20} className="text-[#FF6B00]" strokeWidth={1} />
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {product.keyFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="relative p-8 border border-zinc-800 hover:border-[#FF6B00] transition-all group bg-[#101010] rounded-2xl overflow-hidden"
              >
                <div className="absolute top-6 left-6 text-[40px] font-serif italic text-zinc-800 group-hover:text-[#FFB062]/40 transition-colors leading-none">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <p className="text-sm leading-relaxed text-zinc-300 group-hover:text-white transition-colors mt-12">
                  {feature}
                </p>
                <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-gradient-to-r from-[#FF6B00] via-[#FF9A4D] to-transparent group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How to Play */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 bg-[#050505] border-t border-zinc-900">
        <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-500 text-center mb-16 font-black">
          How to Play
        </h2>
        <div className="grid lg:grid-cols-3 gap-10">
          {[
            {
              id: "01",
              title: "Configuration",
              content: product.howToPlay.setup,
              icon: <ShieldCheck size={20} strokeWidth={1} />,
            },
            {
              id: "02",
              title: "Execution",
              content: product.howToPlay.gameplay,
              icon: <Zap size={20} strokeWidth={1} />,
            },
            {
              id: "03",
              title: "Supremacy",
              content: product.howToPlay.winning,
              icon: <Trophy size={20} strokeWidth={1} />,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="relative min-h-[320px] p-10 border border-zinc-800 flex flex-col group hover:border-[#FF6B00] transition-all duration-700 bg-[#0A0A0A] rounded-2xl"
            >
              <div className="flex justify-between items-start mb-10">
                <span className="text-[40px] font-serif italic text-zinc-700 group-hover:text-[#FFB062]/40 transition-colors leading-none">
                  {item.id}
                </span>
                <span className="text-zinc-500 group-hover:text-[#FF6B00] transition-colors">
                  {item.icon}
                </span>
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-zinc-100 border-b border-zinc-800 pb-4">
                {item.title}
              </h3>
              <p className="text-[13px] leading-[1.8] text-zinc-300 font-normal whitespace-pre-line flex-1">
                {item.content}
              </p>
              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-[#FF6B00] group-hover:w-full transition-all duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      {product.whatYouGet && product.whatYouGet.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 bg-[#050505] border-t border-zinc-900">
          <div className="flex items-center justify-center gap-4 mb-16">
            <Package size={20} className="text-[#FF6B00]" strokeWidth={1} />
            <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-500 text-center font-black">
              What's in the Box
            </h2>
            <Package size={20} className="text-[#FF6B00]" strokeWidth={1} />
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {product.whatYouGet.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-5 p-7 border border-zinc-800 hover:border-[#FF6B00]/70 transition-all group bg-[#101010] rounded-2xl"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#2b1a07] transition-colors">
                  <span className="text-xs font-bold text-[#FFB062]">
                    {idx + 1}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed group-hover:text-white transition-colors pt-1">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {product.faqs && product.faqs.length > 0 && (
        <section className="bg-[#050505] py-24 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif italic text-center mb-6 text-zinc-100">
              Got Doubts? Dare to Ask.
            </h2>
            <p className="text-center text-sm text-zinc-500 mb-16 uppercase tracking-[0.3em]">
              Decode the Deck
            </p>
            <div className="space-y-4">
              {product.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0A0A] border border-zinc-800 overflow-hidden transition-all hover:border-[#FF6B00] rounded-2xl"
                >
                  <button
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === idx ? null : idx)
                    }
                    className="w-full p-7 flex justify-between items-center hover:bg-[#101010] transition-all text-left rounded-2xl"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      size={20}
                      strokeWidth={1.5}
                      className={`flex-shrink-0 text-zinc-400 transition-transform duration-300 ${
                        openFaqIndex === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaqIndex === idx
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-7 pb-7 pt-1 border-t border-zinc-800">
                      <p className="text-sm text-zinc-300 leading-relaxed">
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

      {/* Footer CTA */}
      <section className="border-t border-zinc-900 py-24 px-6 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center">
          <Link
            href="/cart"
            className="flex items-center gap-10 text-4xl md:text-6xl font-serif italic hover:gap-14 transition-all group tracking-tight text-zinc-100"
          >
            Ready to Play{" "}
            <ArrowRight
              size={56}
              className="text-[#FF6B00] group-hover:text-white transition-transform group-hover:translate-x-4"
              strokeWidth={1}
            />
          </Link>
          <div className="mt-12 flex gap-8 text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-bold">
            <span className="hover:text-white cursor-crosshair transition-colors">
              In Stock
            </span>
            <span className="hover:text-white cursor-crosshair transition-colors">
              Global Shipping
            </span>
            <span className="hover:text-white cursor-crosshair transition-colors">
              Curated Quality
            </span>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse {
          animation: pulse 1.5s infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </main>
  );
}