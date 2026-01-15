// app/api/products/route.ts
import { NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(req: Request) {
  await connectDb();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "12"));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(),
  ]);

  return NextResponse.json({
    items,
    meta: { total, page, limit },
  });
}
