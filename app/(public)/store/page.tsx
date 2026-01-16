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

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");

    // Construct query string from searchParams
    const params = new URLSearchParams();
    if (searchParams.page) params.append("page", searchParams.page as string);
    if (searchParams.limit) params.append("limit", searchParams.limit as string);
    if (searchParams.category) params.append("category", searchParams.category as string);
    if (searchParams.mood) params.append("mood", searchParams.mood as string);
    if (searchParams.players) params.append("players", searchParams.players as string);

    // console.log("Fetching products with params:", params.toString());

    const res = await fetch(`${baseUrl}/api/products?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status, res.statusText);
      return { items: [] };
    }

    const data = await res.json();

    // Transform products to ensure meta has required fields
    const transformedItems = data.items.map((item: any) => ({
      ...item,
      meta: {
        players: item.meta?.players || "N/A",
        duration: item.meta?.duration || "N/A",
        age: item.meta?.age || "N/A",
        ...item.meta,
      },
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
      <section className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white py-20 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3" />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4 drop-shadow-xl text-white">
            JJ <span className="text-black inline-block transform -skew-x-12 bg-white px-2">Store</span>
          </h1>
          <p className="text-xl font-medium max-w-2xl mx-auto text-white/90 leading-relaxed">
            Curated board games & card experiences for every occasion.
          </p>
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