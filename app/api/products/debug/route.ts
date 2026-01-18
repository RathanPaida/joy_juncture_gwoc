export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDb();
    const products = await Product.find({}).select("name slug").lean();

    return NextResponse.json({
      count: products.length,
      products: products.map((p) => ({
        name: p.name,
        slug: p.slug,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
