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
  Users,
  Clock,
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
              href="/register"
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
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {showSuccessMessage && <SuccessMessage />}
      {cartError && <ErrorMessage />}
      {showLoginPrompt && <LoginPromptModal />}

      {/* Navigation */}
      <nav className="border-b border-white/5 py-6 px-6 lg:px-12 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-orange-500 font-bold text-lg tracking-wider flex items-center gap-2">
              <span className="text-2xl">▣</span> JOY JUNCTURE
            </Link>
            <div className="hidden md:flex gap-6 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
              <Link href="/store" className="hover:text-white transition-colors">Games</Link>
              <Link href="/community" className="hover:text-white transition-colors">Community</Link>
              <Link href="/events" className="hover:text-white transition-colors">Events</Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative">
              <input type="text" placeholder="Search mysteries..." className="bg-zinc-900/50 border border-zinc-800 rounded-full py-2 px-4 text-xs w-64 focus:outline-none focus:border-zinc-600 text-zinc-300" />
            </div>
            <Link href="/cart" className="relative group">
              <ShoppingBag size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center text-black font-bold">{cartCount}</span>}
            </Link>
            {user ? (
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold text-xs">
                {user.displayName?.[0] || 'U'}
              </div>
            ) : (
              <Link href="/login" className="text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-12 pb-20 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-900/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="flex gap-4">
              <span className="bg-orange-900/30 text-orange-500 border border-orange-500/20 px-3 py-1 rounded text-[9px] uppercase tracking-[0.2em] font-bold">
                New Experience
              </span>
              {product.points?.purchase && (
                <span className="bg-white/10 text-zinc-300 px-3 py-1 rounded text-[9px] uppercase tracking-[0.2em] font-bold">
                  +{product.points.purchase} Points
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-[0.9] tracking-tighter">
              {product.name}
            </h1>

            <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
              {product.shortDescription}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || isAddedToCart || maxStock === 0}
                className="bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-sm px-8 py-4 rounded hover:scale-105 transition-all w-full md:w-auto"
              >
                {getButtonText()} — ₹{product.price.amount}
              </button>
              <button className="bg-zinc-900 hover:bg-zinc-800 p-4 rounded text-white transition-colors border border-white/10">
                <Heart size={20} />
              </button>
            </div>

            {/* Social Proof Mock */}
            <div className="flex items-center gap-4 bg-zinc-900/30 p-4 rounded-lg border border-white/5 inline-flex">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-black flex items-center justify-center text-[8px] font-bold text-zinc-400">
                    {i}
                  </div>
                ))}
              </div>
              <div className="text-xs text-zinc-400 font-medium">
                <span className="text-white font-bold">1.2k+</span> detectives played this month
              </div>
            </div>

            {/* Quantity Controls - Optional but useful to keep accessible */}
            {maxStock > 0 && (
              <div className="flex items-center gap-4 pt-4 border-t border-white/5 w-fit">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Quantity</span>
                <div className="flex items-center bg-zinc-900 rounded-full px-2 py-1">
                  <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded-full text-zinc-400">-</button>
                  <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} disabled={quantity >= maxStock} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded-full text-zinc-400">+</button>
                </div>
              </div>
            )}
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-[4/5] relative rounded-lg overflow-hidden border border-white/10 shadow-2xl group cursor-pointer" onClick={() => setSelectedImage(product.media.thumbnail)}>
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
              />
              {/* Floating Info */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400">Difficulty</p>
                    <p className="text-sm font-bold text-white uppercase">{product.meta.difficulty}</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400">Time</p>
                    <p className="text-sm font-bold text-white uppercase">{product.meta.duration}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {[product.media.thumbnail, ...(product.media.images || [])].map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 aspect-square rounded overflow-hidden border ${selectedImage === img ? 'border-orange-500' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-zinc-900/30 border-y border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <Users className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">Players</p>
              <p className="text-xl font-bold italic">{product.meta.players}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">Duration</p>
              <p className="text-xl font-bold italic">{product.meta.duration}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Zap className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">Difficulty</p>
              <p className="text-xl font-bold italic">{product.meta.difficulty}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Sparkles className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">Vibe</p>
              <div className="flex gap-2">
                {product.meta.moods?.slice(0, 2).map(m => (
                  <span key={m} className="text-xs font-bold bg-white/5 px-2 py-1 rounded border border-white/5">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Concept */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-black italic uppercase">The Concept</h2>
            <div className="h-px bg-orange-500 w-16" />
          </div>

          <div className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 grid lg:grid-cols-2">
            <div className="p-10 lg:p-16 flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-6 text-white uppercase italic">
                {product.shortDescription || "A immersive experience"}
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-8 whitespace-pre-line">
                {product.story || product.shortDescription}
              </p>
              <button className="text-orange-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors flex items-center gap-2">
                Read Full Dossier <ArrowRight size={14} />
              </button>
            </div>
            <div className="relative min-h-[400px] bg-zinc-900 border-l border-white/5">
              {/* Placeholder for Concept Image if not available separately, usually we'd use a specific image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2/3 aspect-[3/4] bg-[#050505] shadow-2xl skew-y-3 rounded border border-white/10 relative">
                  <img src={product.media.thumbnail} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center backdrop-blur-md border border-orange-500/50">
                      <span className="font-serif italic text-orange-500 text-xl">JJ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inside The Box & How To Play Split */}
      <section className="py-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">

          {/* Inside The Box */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400 mb-8 border-b border-white/10 pb-4">
              Inside The Box
            </h2>

            {product.whatYouGet && product.whatYouGet.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {product.whatYouGet.map((item, i) => (
                  <div key={i} className="bg-[#111] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center gap-4 hover:border-white/20 transition-colors group">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                      <Package size={20} />
                    </div>
                    <span className="text-sm font-bold text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-[#111] rounded-xl border border-white/5 flex items-center justify-center">
                    <span className="text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Component {i}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How To Play */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400 mb-8 border-b border-white/10 pb-4">
              How To Play
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 flex-shrink-0 bg-[#151515] border border-white/10 rounded flex items-center justify-center text-orange-500 font-bold font-serif text-xl group-hover:bg-orange-500 group-hover:text-black transition-colors">1</div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Set The Scene</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{product.howToPlay?.setup || "Dim the lights, prepare the board."}</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 flex-shrink-0 bg-[#151515] border border-white/10 rounded flex items-center justify-center text-orange-500 font-bold font-serif text-xl group-hover:bg-orange-500 group-hover:text-black transition-colors">2</div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Assign Roles</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{product.howToPlay?.gameplay || "Choose your character and receive your mission."}</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 flex-shrink-0 bg-[#151515] border border-white/10 rounded flex items-center justify-center text-orange-500 font-bold font-serif text-xl group-hover:bg-orange-500 group-hover:text-black transition-colors">3</div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Solve The Crime</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{product.howToPlay?.winning || "Gather clues and find the solution before time runs out."}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-zinc-900/30 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 text-[#FFB062] mb-2">
                <Trophy size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Joy Level: 9.8/10</span>
              </div>
              <p className="text-zinc-400 text-sm italic">
                "The best party game we've played in years. The character backstories are incredible!"
              </p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-2 font-bold">— BoardGameGeeks Review</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Simplified for this page) */}
      <footer className="bg-black py-20 border-t border-zinc-900 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Link href="/" className="text-2xl font-bold tracking-widest text-white mb-8 inline-block">JOY JUNCTURE</Link>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-12">
            Creating cinematic table-top experiences that turn every gathering into a legendary night.
          </p>
          <div className="flex justify-center gap-8 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
            <Link href="/store" className="hover:text-white">Shop</Link>
            <Link href="/community" className="hover:text-white">Community</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
          </div>
          <p className="text-[10px] text-zinc-700 mt-20">© 2024 JOY JUNCTURE GAMES. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </main>
  );
}