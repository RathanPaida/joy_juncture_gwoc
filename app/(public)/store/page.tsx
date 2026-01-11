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
            {/* Call to Action */}
            <div className="text-white text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Ready to Game?</h3>
              <p className="text-gray-300 text-lg">
                Your next favorite game awaits
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors group"
                aria-label="Twitter"
              >
                <svg
                  className="w-5 h-5 text-black group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors group"
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5 text-black group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center hover:border-orange-500 transition-colors group"
                aria-label="GitHub"
              >
                <svg
                  className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="max-w-md mx-auto text-center">
              <h4 className="text-white font-semibold mb-2">
                Stay Updated
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                Subscribe to get notified about new games and exclusive deals
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-500 focus:outline-none"
                />
                <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}