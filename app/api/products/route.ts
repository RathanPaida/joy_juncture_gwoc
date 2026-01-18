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
    const typeRegex = new RegExp(gametype, "i");
    query.$or = [
      { gametype: typeRegex },
      { category: { $in: [typeRegex] } }
    ];
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
    const playerList = players.split(",");
    const regexConditions = playerList.map(p => {
      if (p === "3-5") return /(3|4|5|^1-|^2-)/i;
      if (p === "5-7") return /(5|6|7|^1-|^2-|^3-|^4-)/i;
      if (p === "7+") return /(7|8|9|^1-|^2-|^3-|^4-|^5-|^6-)/i;
      return new RegExp(p, "i");
    });
    query["meta.players"] = { $in: regexConditions };
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
