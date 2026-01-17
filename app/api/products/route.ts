// app/api/products/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(req: Request) {
  await connectDb();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "12"));
  const skip = (page - 1) * limit;

  // Build filter query
  const query: any = {};

  // Category (Occasion)
  const category = url.searchParams.get("category");
  if (category) {
    // Split by comma in case multiple selected
    const categories = category.split(",");
    query.category = { $in: categories.map(c => new RegExp(c, "i")) };
  }

  // Gametype
  const gametype = url.searchParams.get("gametype");
  if (gametype) {
    // Assuming gametype is a single value for exact match
    query.gametype = new RegExp(gametype, "i");
  }

  // Mood
  const mood = url.searchParams.get("mood");
  if (mood) {
    const moods = mood.split(",");
    query["meta.moods"] = { $in: moods.map(m => new RegExp(m, "i")) };
  }

  // Players
  const players = url.searchParams.get("players");
  if (players) {
    // Exact match or contains for now, simplest approach
    // If standardized like "3-5", we can search for it
    const playerList = players.split(",");
    query["meta.players"] = { $in: playerList.map(p => new RegExp(p, "i")) };
  }

  const [items, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({
    items,
    meta: { total, page, limit },
  });
}
