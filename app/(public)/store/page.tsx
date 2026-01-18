// app/(public)/store/page.tsx
import { Metadata } from "next";
import ProductCard from "../../components/ProductCard";
import StoreFilters from "../../components/StoreFilters";

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

import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    await connectDb();

    // Parse filters
    const query: any = {};

    // Category (Occasion)
    if (searchParams.category) {
      const categories = (searchParams.category as string).split(",");
      query.category = { $in: categories.map(c => new RegExp(c, "i")) };
    }

    // Gametype - Check both gametype field and category array
    if (searchParams.gametype) {
      const typeRegex = new RegExp(searchParams.gametype as string, "i");
      query.$or = [
        { gametype: typeRegex },
        { category: { $in: [typeRegex] } }
      ];
    }

    // Mood
    if (searchParams.mood) {
      const moods = (searchParams.mood as string).split(",");
      query["meta.moods"] = { $in: moods.map(m => new RegExp(m, "i")) };
    }

    // Players - Improved matching for ranges
    if (searchParams.players) {
      const playerList = (searchParams.players as string).split(",");
      // logic: if searching for "3-5", we match if data contains 3, 4, 5 OR if data starts with 1- or 2- (covering the range)
      // This is a heuristic to handle "2-8" matching "3-5"
      const regexConditions = playerList.map(p => {
        if (p === "3-5") return /(3|4|5|^1-|^2-)/i;
        if (p === "5-7") return /(5|6|7|^1-|^2-|^3-|^4-)/i;
        if (p === "7+") return /(7|8|9|^1-|^2-|^3-|^4-|^5-|^6-)/i;
        return new RegExp(p, "i");
      });
      query["meta.players"] = { $in: regexConditions };
    }

    // Pagination
    const page = parseInt(searchParams.page as string || "1");
    const limit = parseInt(searchParams.limit as string || "50"); // Higher default limit for store
    const skip = (page - 1) * limit;

    const items = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform and serialize
    const transformedItems = items.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
      price: {
        amount: item.price?.amount || 0,
        currency: item.price?.currency || 'INR',
      },
      meta: {
        players: item.meta?.players || "N/A",
        duration: item.meta?.duration || "N/A",
        age: item.meta?.age || "N/A",
        ...item.meta,
      },
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
    }));

    return { items: transformedItems };
  } catch (error) {
    console.error("Error fetching products:", error);
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

export default async function StorePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { items } = await getProducts(searchParams);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,140,0,0.05)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(255,179,71,0.03)_0%,transparent_50%)]" />
      </div>

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-20 relative z-10">
        <div className="max-w-7xl mx-auto relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ff8c00]/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              <span className="text-white">The Digital </span>
              <span className="text-[#ff8c00]">Playground</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl font-medium">
              Discover games that spark connection and belonging. From icebreakers for weddings to intense strategy for game nights.
            </p>

            <a
              href="#game-collection"
              className="bg-[#ff8c00] text-black font-bold px-8 py-4 rounded-full hover:bg-[#e67e00] hover:shadow-[0_10px_30px_rgba(255,140,0,0.4)] transition-all inline-flex items-center gap-2 transform hover:-translate-y-1 duration-300"
            >
              Explore Collections
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Filters Sidebar */}
          <StoreFilters />

          {/* Product Grid */}
          <div className="flex-1">
            <div id="game-collection" className="mb-6 flex items-center justify-between scroll-mt-20">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  Game Collection
                  <span className="text-sm font-semibold text-[#ff8c00] bg-[#ff8c00]/10 px-3 py-1 rounded-full border border-[#ff8c00]/20">
                    {items.length}
                  </span>
                </h2>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product: StoreProduct) => (
                  <div
                    key={product._id}
                    className="group relative rounded-2xl bg-[rgba(20,20,20,0.8)] overflow-hidden border border-[rgba(255,140,0,0.2)] hover:border-[#ff8c00] hover:shadow-[0_0_30px_rgba(255,140,0,0.2)] transition-all duration-500 backdrop-blur-sm"
                  >
                    <div className="relative z-10">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-32 bg-[rgba(20,20,20,0.6)] rounded-3xl border-2 border-dashed border-[rgba(255,140,0,0.3)] backdrop-blur-sm">
                <div className="text-6xl mb-6 opacity-50 animate-pulse">🎲</div>
                <h3 className="text-2xl font-bold text-white mb-3">No matches found</h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
                  We couldn't find any games matching your current filters. Try selecting different options!
                </p>
                <button className="bg-[#ff8c00] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#e67e00] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(255,140,0,0.3)]">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}