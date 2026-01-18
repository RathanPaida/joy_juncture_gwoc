import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "../../../components/ProductDetail";
import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    await connectDb();

    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      return null;
    }

    // Serialize MongoDB document to plain object
    return {
      ...product,
      _id: product._id.toString(),
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : undefined,
      updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
      price: {
        amount: product.price?.amount || 0,
        currency: product.price?.currency || 'INR',
      },
      points: {
        purchase: product.points?.purchase || 0,
      },
      meta: {
        players: product.meta?.players || "N/A",
        duration: product.meta?.duration || "N/A",
        age: product.meta?.age || "N/A",
        difficulty: product.meta?.difficulty || "Medium",
        badges: product.meta?.badges || [],
        moods: product.meta?.moods || [],
        ...product.meta,
      },
      stock: product.stock?.quantity || 0,
    };
  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product: any = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | Joy Juncture",
      description: "The product you're looking for could not be found.",
    };
  }

  return {
    title: `${product.name} | JJ Store - Joy Juncture`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [product.media.thumbnail],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
      images: [product.media.thumbnail],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product: any = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
