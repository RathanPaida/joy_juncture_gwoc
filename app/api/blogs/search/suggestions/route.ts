export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../../../lib/mongodb";
import { Blog } from "../../../../../models/Blog";

// Popular search suggestions
const POPULAR_SEARCHES = [
  "Dead Man's Deck",
  "Strategy Guide",
  "Game Night",
  "Beginners",
  "Advanced Tactics",
  "Event Planning",
  "Community Stories",
  "Team Building",
  "Wedding Games",
  "Corporate Events",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: POPULAR_SEARCHES.slice(0, 5),
      });
    }

    await connectDb();

    // Search in database for suggestions
    const suggestions = await Blog.aggregate([
      {
        $match: {
          status: "published",
          $or: [
            { title: { $regex: query, $options: "i" } },
            { excerpt: { $regex: query, $options: "i" } },
            { tags: { $regex: query, $options: "i" } },
            { "author.name": { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          title: 1,
          score: {
            $cond: [
              { $regexMatch: { input: "$title", regex: query, options: "i" } },
              3,
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$excerpt",
                      regex: query,
                      options: "i",
                    },
                  },
                  2,
                  1,
                ],
              },
            ],
          },
        },
      },
      { $sort: { score: -1, _id: -1 } },
      { $limit: 5 },
    ]);

    // Combine with popular searches
    const allSuggestions = [
      ...suggestions.map((s: { title: any }) => s.title),
      ...POPULAR_SEARCHES.filter(
        (term) =>
          term.toLowerCase().includes(query) &&
          !suggestions.some((s: { title: string }) => s.title === term),
      ),
    ].slice(0, 8);

    return NextResponse.json({
      success: true,
      data: allSuggestions,
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({
      success: true,
      data: POPULAR_SEARCHES.slice(0, 5),
    });
  }
}
