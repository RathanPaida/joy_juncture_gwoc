export const dynamic = 'force-dynamic';
// app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDb();

    const { slug } = await params;

    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
