// app/(public)/store/page.tsx - Alternative solution without shared types

import { Metadata } from "next";
import ProductCard from "../../components/ProductCard";

// Define a compatible Product type that matches ProductCard's expectations
type StoreProduct = {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: { 
    amount: number; 
    currency: string;
  };
  media: { 
    thumbnail: string;
  };
  meta: {
    players: string;
    duration: string;
    age: string;
    title?: string;
    description?: string;
    keywords?: string[];
    createdAt?: string;
    updatedAt?: string;
  };
};

async function getProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const res = await fetch(`${baseUrl}/api/products?page=1&limit=12`, { 
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('Failed to fetch products:', res.status, res.statusText);
      return { items: [] };
    }

    const data = await res.json();
    
    // Transform products to ensure meta has required fields
    const transformedItems = data.items.map((item: any) => ({
      ...item,
      meta: {
        players: item.meta?.players || 'N/A',
        duration: item.meta?.duration || 'N/A',
        age: item.meta?.age || 'N/A',
        ...item.meta,
      }
    }));

    return { items: transformedItems };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { items: [] };
  }
}

export const metadata: Metadata = {
  title: "JJ Store | Board Games & Card Games",
  description: "Shop the finest board games and card games",
  keywords: ["board games", "card games", "tabletop games", "game store"],
  openGraph: {
    title: "JJ Store | Board Games & Card Games",
    description: "Shop the finest board games and card games",
    type: "website",
  },
};

export default async function StorePage() {
  const { items } = await getProducts();

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800">
      {/* Hero Section with Orange Gradient */}
      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white py-16 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-orange-400/20 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full translate-x-24 translate-y-24 blur-3xl" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-lg rotate-12" />
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-black rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-white rounded-lg -rotate-6" />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight text-white drop-shadow-lg">
            JJ <span className="text-black">STORE</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium opacity-95 text-gray-900 bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            Discover amazing board games and card games
          </p>
          
          {/* Brand Elements */}
          <div className="mt-8 flex items-center space-x-2">
            <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-75" />
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-150" />
          </div>

          {/* Stats or Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{items.length}+</div>
              <div className="text-sm text-gray-900">Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">Fast</div>
              <div className="text-sm text-gray-900">Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">Top</div>
              <div className="text-sm text-gray-900">Quality</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {items.length > 0 ? (
          <>
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Featured Games
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
            </div>

            {/* Product Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((product: StoreProduct) => (
                <div
                  key={product._id}
                  className="group relative rounded-2xl bg-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(251,146,60,0.4)]"
                >
                  {/* Gradient border on hover */}
                  <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Card content */}
                  <div className="relative z-10 rounded-2xl bg-black text-white">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-black/60 rounded-2xl backdrop-blur-sm border border-orange-500/30 text-white">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/50">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">No products found</h3>
            <p className="text-gray-300 mb-6">
              Check back soon for new arrivals!
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
              Notify Me
            </button>
          </div>
        )}
      </section>

      {/* Footer Banner */}
      <section className="border-t border-gray-800 bg-gradient-to-r from-gray-900 to-black py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          </div>
        </div>
      </section>
    </main>
  );
}