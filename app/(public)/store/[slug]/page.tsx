import { Metadata } from "next";
import ProductDetail from "../../../components/ProductDetail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | JJ Store`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
        <a href="/store" className="inline-block px-6 py-2 bg-purple-600 text-white rounded">
          Back to Store
        </a>
      </main>
    );
  }

  return <ProductDetail product={product} />;
}
