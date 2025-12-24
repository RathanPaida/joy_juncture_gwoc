import { Metadata } from "next";
import ProductCard from "../../components/ProductCard";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
}

async function getProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products?page=1&limit=12`, {
    cache: "no-store",
  });
  if (!res.ok) return { items: [], meta: { total: 0, page: 1, limit: 12 } };
  return res.json();
}

export const metadata: Metadata = {
  title: "JJ Store - Board Games & Card Games",
  description: "Shop the finest board games and card games at Joy Junction",
};

export default async function StorePage() {
  const { items, meta } = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">JJ Store</h1>
          <p className="text-xl opacity-90">Discover amazing board games and card games</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        {items.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No products found</p>
        )}
      </section>
    </main>
  );
}
