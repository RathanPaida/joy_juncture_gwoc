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

    // Gametype
    if (searchParams.gametype) {
      query.gametype = new RegExp(searchParams.gametype as string, "i");
    }

    // Mood
    if (searchParams.mood) {
      const moods = (searchParams.mood as string).split(",");
      query["meta.moods"] = { $in: moods.map(m => new RegExp(m, "i")) };
    }

    // Players
    if (searchParams.players) {
      const playerList = (searchParams.players as string).split(",");
      query["meta.players"] = { $in: playerList.map(p => new RegExp(p, "i")) };
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
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30">

      {/* Hero Section */}
      <section className="px-6 py-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-orange-600 to-amber-600 rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              The Digital Playground
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl font-medium">
              Discover games that spark connection and belonging. From icebreakers for weddings to intense strategy for game nights.
            </p>

            <button className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-zinc-100 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200">
              Explore Collections
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Filters Sidebar */}
          <StoreFilters />

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Game Collection <span className="text-sm font-normal text-white/50 bg-white/10 px-2 py-0.5 rounded-full">{items.length}</span>
                </h2>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product: StoreProduct) => (
                  <div
                    key={product._id}
                    className="group relative rounded-2xl bg-neutral-900 overflow-hidden border border-white/10 hover:border-orange-500 hover:shadow-[0_0_30px_rgba(255,140,0,0.15)] transition-all duration-500"
                  >
                    <div className="relative z-10">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-32 bg-neutral-900/50 rounded-3xl border border-dashed border-white/10">
                <div className="text-6xl mb-4 opacity-50">🎲</div>
                <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
                <p className="text-white/40 mb-8 max-w-md mx-auto">
                  We couldn't find any games matching your current filters. Try selecting different options!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}