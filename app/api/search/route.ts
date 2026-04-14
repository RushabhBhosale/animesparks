import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

import { client } from "@/sanity/lib/client";
import { runFuzzySearch, type SearchDoc } from "@/utils/search-index";

const searchQuery = groq`
*[
  _type == "post" &&
  defined(slug.current) &&
  publishedAt <= now()
]
| order(publishedAt desc)[0...$limit]{
  _id,
  title,
  "metaDescription": coalesce(metaDescription, pt::text(body)),
  "slug": slug.current,
  "typeLabel": coalesce(categories[0]->title, "Article")
}
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") || "";
  const q = raw.trim();
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 7;
  const fetchCap = Math.min(Math.max(limit * 8, 80), 300);

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const fetched = await client.fetch<SearchDoc[]>(searchQuery, {
      limit: fetchCap,
    });

    const ranked = runFuzzySearch(q, fetched ?? [], limit);

    return NextResponse.json({
      results: ranked,
    });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
