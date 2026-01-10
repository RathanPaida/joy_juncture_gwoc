"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Heart, ShoppingBag, Share2, Plus, ArrowRight, ShieldCheck, Zap, Trophy, 
  ChevronDown, Package, Sparkles, ShoppingCart, Check, LogIn, X, Minus 
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
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
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
  const [tempQuantity, setTempQuantity] = useState('1');
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
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    console.log('handleQuantityChange called with delta:', delta);
    console.log('Current quantity:', quantity);
    console.log('Max stock:', maxStock);
    
    const newQuantity = quantity + delta;
    console.log('New quantity would be:', newQuantity);
    
    if (newQuantity) {
      setQuantity(newQuantity);
      console.log('Quantity updated to:', newQuantity);
    } else {
      console.log('Quantity change blocked - out of range');
    }
  };

  // Handle direct quantity input
  const handleQuantityInput = (value: string) => {
    // Allow empty string or numbers only
    if (value === '' || /^\d+$/.test(value)) {
      setTempQuantity(value);
    }
  };

  const handleQuantityBlur = () => {
    const num = parseInt(tempQuantity);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
      setTempQuantity('1');
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
    if (e.key === 'Enter') {
      handleQuantityBlur();
    } else if (e.key === 'Escape') {
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

    // Validate stock availability BEFORE making API call
    if (quantity > maxStock) {
      setCartError(`Only ${maxStock} items available in stock`);
      setTimeout(() => setCartError(null), 5000);
      return;
    }

    if (maxStock === 0 || !product.stock) {
      setCartError('This product is currently out of stock');
      setTimeout(() => setCartError(null), 5000);
      return;
    }

    setIsAddingToCart(true);
    setIsAddedToCart(false);

    try {
      const token = await getAuthToken();
      
      if (!token) {
        setCartError('Unable to authenticate. Please login again.');
        setTimeout(() => setCartError(null), 5000);
        setIsAddingToCart(false);
        return;
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          productSlug: product.slug,
          name: product.name,
          price: product.price.amount,
          quantity: quantity,
          image: product.media.thumbnail,
          points: product.points?.purchase || 0
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
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
          setTempQuantity('1');
        }, 3000);
      } else {
        if (response.status === 401 && retryCount < 2) {
          setRetryCount(prev => prev + 1);
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
      console.error('Error adding to cart:', error);
      setCartError(error.message || 'Network error. Please try again.');
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

      const response = await fetch('/api/cart/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return;

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response from cart count');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setCartCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      updateCartCount();
    }
  }, [user]);

  const handleLoginRedirect = () => {
    router.push(`/login?redirect=/products/${product.slug}`);
    setShowLoginPrompt(false);
  };

  const handleContinueShopping = () => {
    setShowLoginPrompt(false);
  };

  // Success Message Component
  const SuccessMessage = () => (
    <div className="fixed top-24 right-8 z-50 animate-slide-in">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Added to cart successfully!
            </p>
            <p className="text-xs text-green-600 mt-1">
              {quantity} × "{product.name}" added to your collection
            </p>
            <div className="flex gap-3 mt-3">
              <Link 
                href="/cart" 
                className="text-xs font-bold text-green-700 hover:text-green-900 underline"
              >
                View Cart
              </Link>
              <button 
                onClick={() => setShowSuccessMessage(false)}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Continue Shopping
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // Error Message Component
  const ErrorMessage = () => (
    <div className="fixed top-24 right-8 z-50 animate-slide-in">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Unable to add to cart
            </p>
            <p className="text-xs text-red-600 mt-1">{cartError}</p>
            {cartError?.includes('login') && (
              <button
                onClick={handleLoginRedirect}
                className="mt-2 text-xs font-bold text-red-700 hover:text-red-900 underline"
              >
                Login & Retry
              </button>
            )}
            <div className="mt-3">
              <button 
                onClick={() => setCartError(null)}
                className="text-xs font-bold text-red-700 hover:text-red-900 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => setCartError(null)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // Login Prompt Modal Component
  const LoginPromptModal = () => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-zinc-100 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-serif italic">Sign in to continue</h3>
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="text-zinc-400 hover:text-black transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          <p className="text-zinc-600 text-sm leading-relaxed">
            You need to be signed in to add items to your collection. Sign in or create an account to continue shopping and earn JJ Points.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 text-xs font-bold">i</span>
              </div>
              <p className="text-xs text-amber-800">
                Earn <span className="font-bold">+{(product.points?.purchase || 0) * quantity} JJ Points</span> with this purchase!
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={handleLoginRedirect}
            className="w-full bg-black text-white h-14 text-sm font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 rounded-xl active:scale-[0.99]"
          >
            <LogIn size={16} /> Sign In to Continue
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleContinueShopping}
              className="flex-1 border border-zinc-200 h-12 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 transition-all rounded-xl"
            >
              Continue Browsing
            </button>
            <Link
              href="/signup"
              className="flex-1 border border-zinc-800 h-12 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all rounded-xl flex items-center justify-center"
            >
              Create Account
            </Link>
          </div>
        </div>
        
        <p className="text-xs text-zinc-400 mt-8 text-center pt-6 border-t border-zinc-100">
          By signing in, you agree to our <Link href="/terms" className="text-black underline">Terms</Link> and <Link href="/privacy" className="text-black underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );

  const getButtonText = () => {
    if (authLoading) return "Checking...";
    if (isAddingToCart) return "Adding...";
    if (isAddedToCart) return "Added to Cart!";
    return `Add ${quantity > 1 ? quantity : ''} to Collection`.trim();
  };

  const getButtonIcon = () => {
    if (authLoading) return (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    );
    if (isAddingToCart) return (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    );
    if (isAddedToCart) return <Check size={14} />;
    return <ShoppingCart size={14} />;
  };

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a] selection:bg-purple-100 font-sans relative">
      {showSuccessMessage && <SuccessMessage />}
      {cartError && <ErrorMessage />}
      {showLoginPrompt && <LoginPromptModal />}

      {/* The Ghost Header */}
      <nav className="border-b border-zinc-100 py-6 px-8 lg:px-16 sticky top-0 bg-white/90 backdrop-blur-sm z-40">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex gap-4 text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold">
            <Link href="/" className="hover:text-black transition-all">Studio</Link>
            <span className="text-zinc-200">/</span>
            <Link href="/store" className="hover:text-black transition-all">Archive</Link>
            <span className="text-zinc-200">/</span>
            <span className="text-black italic font-serif tracking-widest">{product.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/cart" 
              className="relative flex items-center gap-2 text-[10px] tracking-[0.3em] font-bold uppercase hover:text-black transition-colors text-zinc-500 group"
            >
              <ShoppingBag size={14} className="group-hover:scale-110 transition-transform" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[8px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="text-[10px] tracking-[0.5em] font-black uppercase text-zinc-300">JJ Games © 2025</div>
          </div>
        </div>
      </nav>

      <section className="max-w-screen-2xl mx-auto px-8 lg:px-16 py-12 lg:py-20">
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          
          {/* Editorial Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F6F6] group border border-zinc-50 rounded-xl">
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
                  className={`aspect-[4/3] cursor-pointer overflow-hidden transition-all duration-500 border rounded-lg ${selectedImage === img ? 'border-black border-2' : 'border-transparent opacity-40 hover:opacity-100 hover:border-zinc-300'}`}
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

          {/* Product Details */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 flex flex-col border-l border-zinc-100 pl-12 min-h-[400px] justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.6em] text-zinc-400 font-black">{product.category[0]}</span>
                {product.meta.badges?.[0] && (
                  <span className="text-[8px] px-3 py-1 bg-black text-white font-bold tracking-[0.2em] uppercase rounded-full">
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
                  <span className="text-4xl font-light tracking-tighter text-black">₹{(product.price.amount * quantity).toLocaleString("en-IN")}</span>
                  {quantity > 1 && (
                    <span className="text-xs text-zinc-400 mt-1">₹{product.price.amount.toLocaleString("en-IN")} × {quantity}</span>
                  )}
                </div>
                {product.points?.purchase !== undefined && (
                  <div className="pb-1">
                    <span className="text-[10px] text-purple-600 font-black tracking-widest uppercase bg-purple-50 px-3 py-1 rounded-full">
                      +{(product.points.purchase * quantity)} JJ Points
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="quantity-selector-container">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold">Quantity</span>
                  {maxStock <= 10 && (
                    <span className="text-[8px] uppercase tracking-wider text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">
                      Only {maxStock} left
                    </span>
                  )}
                </div>
                <div className="quantity-selector">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(-1);
                    }}
                    disabled={quantity <= 1}
                    className="quantity-btn minus"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <div 
                    className="quantity-display"
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
                        className="quantity-input"
                        autoFocus
                        maxLength={3}
                      />
                    ) : (
                      <span className="quantity-number">{quantity}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(1);
                    }}
                    disabled={quantity >= maxStock}
                    className="quantity-btn plus"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isAddedToCart || authLoading || maxStock === 0}
                  className={`group relative w-full h-16 text-[10px] font-bold uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 rounded-xl active:scale-[0.98] ${
                    maxStock === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed hover:bg-gray-400'
                      : isAddedToCart 
                      ? 'bg-green-600 text-white cursor-default hover:bg-green-600' 
                      : isAddingToCart || authLoading
                      ? 'bg-zinc-400 text-white cursor-wait hover:bg-zinc-400' 
                      : 'bg-black text-white hover:bg-zinc-900 hover:scale-[1.02]'
                  }`}
                >
                  {getButtonIcon()}
                  {maxStock === 0 ? 'Out of Stock' : getButtonText()}
                  <div className="absolute top-0 right-0 w-1 h-1 bg-purple-500 group-hover:w-3 transition-all" />
                </button>
                
                <div className="flex gap-3">
                  <button className="flex-1 border border-zinc-200 h-14 flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-xl group">
                    <Heart size={14} className="group-hover:text-red-500 transition-colors" /> Wishlist
                  </button>
                  <button className="w-14 border border-zinc-200 h-14 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all rounded-xl">
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
              <div key={idx} className="p-10 border border-zinc-200 hover:border-black transition-all group relative bg-white rounded-xl">
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
            <div key={i} className="relative min-h-[320px] p-10 border border-zinc-100 flex flex-col group hover:border-black transition-all duration-700 bg-zinc-50/30 rounded-xl">
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
              <div key={idx} className="flex items-start gap-5 p-8 border border-zinc-100 hover:border-zinc-300 transition-all group bg-white rounded-xl">
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
                <div key={idx} className="bg-white border border-zinc-200 overflow-hidden transition-all hover:border-black rounded-xl">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-8 flex justify-between items-center hover:bg-zinc-50 transition-all text-left rounded-xl"
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
          <Link 
            href="/cart" 
            className="flex items-center gap-10 text-5xl md:text-7xl font-serif italic hover:gap-16 transition-all group tracking-tighter"
          >
            Ready to Play <ArrowRight size={64} className="text-purple-600 group-hover:text-black transition-transform group-hover:translate-x-4" strokeWidth={1} />
          </Link>
          <div className="mt-16 flex gap-12 text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold">
            <span className="hover:text-black cursor-crosshair transition-colors">In Stock</span>
            <span className="hover:text-black cursor-crosshair transition-colors">Global Shipping</span>
            <span className="hover:text-black cursor-crosshair transition-colors">Curated Quality</span>
          </div>
        </div>
      </section>

      {/* CSS Styles */}
      <style jsx global>{`
        .quantity-selector-container {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%);
          border: 1px solid rgba(249, 115, 22, 0.1);
          border-radius: 12px;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
        }

        .quantity-selector:hover {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .quantity-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #000;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-weight: bold;
        }

        .quantity-btn:hover:not(:disabled) {
          background: #f97316;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .quantity-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .quantity-btn:disabled {
          background: #e5e5e5;
          color: #a1a1aa;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .quantity-btn.minus {
          background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
        }

        .quantity-btn.plus {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
          color: #000;
        }

        .quantity-btn.plus:hover:not(:disabled) {
          background: linear-gradient(135deg, #fb923c 0%, #fdba74 100%);
        }

        .quantity-display {
          flex: 1;
          text-align: center;
          padding: 0 1rem;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quantity-display:hover {
          background: rgba(249, 115, 22, 0.05);
          border-radius: 8px;
        }

        .quantity-input {
          width: 100%;
          text-align: center;
          font-size: 1.75rem;
          font-weight: 700;
          font-family: 'Space Grotesk', monospace;
          background: linear-gradient(135deg, #000 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          border: none;
          outline: none;
          padding: 0.25rem;
        }

        .quantity-input:focus {
          background: #f97316;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .quantity-number {
          font-size: 1.75rem;
          font-weight: 700;
          font-family: 'Space Grotesk', monospace;
          background: linear-gradient(135deg, #000 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

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
          0%, 100% {
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