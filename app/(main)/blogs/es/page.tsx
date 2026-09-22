import { paginate, withListingMetadata, type ListingSearchParams } from "@/lib/pagination";
import { ArticleArchive } from "@/components/article-archive";
import type { Metadata } from "next";

import type { BlogCategory, BlogPost } from "../types";
import { client } from "@/sanity/lib/client";
import { categoriesQuery, spanishBlogsQuery } from "@/sanity/blogQueries";
import { canonicalizeSearchValue } from "@/utils/search-index";
import { defaultOgImage, siteName } from "@/utils/seo";

export const revalidate = 60;

const metaTitle = "Anime Blogs in Spanish";
const metaDescription =
  "Browse AnimeSparks articles in Spanish, including analysis, explanations, and editorial deep dives.";

const baseMetadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/blogs/es",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/blogs/es",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
    images: [defaultOgImage],
  },
};

export async function generateMetadata({ searchParams }: { searchParams?: Promise<ListingSearchParams> }): Promise<Metadata> {
  return withListingMetadata(baseMetadata, "/blogs/es", (await searchParams) || {});
}

export default async function SpanishBlogsPage({
  searchParams,
}: {
  searchParams?: Promise<ListingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.toLowerCase().trim();
  const normalizedQuery = query ? canonicalizeSearchValue(query) : "";

  const blogs = await client.fetch<BlogPost[]>(spanishBlogsQuery);
  const categories = await client.fetch<BlogCategory[]>(categoriesQuery);

  const posts = (blogs ?? []).filter((post) => {
    if (!normalizedQuery) return true;
    const content = [post.title, post.metaDescription || post.excerpt]
      .filter(Boolean)
      .map((entry) => canonicalizeSearchValue(entry || ""))
      .join(" ");
    return content.includes(normalizedQuery);
  });

  const { items, pagination } = paginate(posts, params.page);

  return <ArticleArchive posts={items} pagination={pagination} categories={categories || []} query={query} locale="es" />;
}
