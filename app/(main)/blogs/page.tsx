import { paginate, withListingMetadata, type ListingSearchParams } from "@/lib/pagination";
import { ArticleArchive } from "@/components/article-archive";
import type { Metadata } from "next";

import { client } from "@/lib/content/client";
import { blogsQuery, categoriesQuery } from "@/sanity/blogQueries";
import { defaultOgImage, siteName } from "@/utils/seo";
import { canonicalizeSearchValue } from "@/utils/search-index";
import type { BlogCategory, BlogPost } from "./types";

export const revalidate = 60;

const metaTitle = "Anime Blogs & Analysis";
const metaDescription =
  "Browse all anime articles on AnimeSparks — reviews, breakdowns, opinions, and deep dives into storytelling, characters, and themes.";

const baseMetadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/blogs",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/blogs",
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
  return withListingMetadata(baseMetadata, "/blogs", (await searchParams) || {});
}

export default async function AllBlogsPage({
  searchParams,
}: {
  searchParams?: Promise<ListingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.toLowerCase().trim();
  const normalizedQuery = query ? canonicalizeSearchValue(query) : "";
  const activeSort =
    sort === "popular" ? "popular" : sort === "recent" ? "recent" : "all";

  const blogs = await client.fetch<BlogPost[]>(blogsQuery);
  const categories = await client.fetch<BlogCategory[]>(categoriesQuery);

  const posts = (blogs ?? []).filter((post) => {
    if (!normalizedQuery) return true;
    const content = [post.title, post.metaDescription || post.excerpt]
      .filter(Boolean)
      .map((entry) => canonicalizeSearchValue(entry || ""))
      .join(" ");
    return content.includes(normalizedQuery);
  });

  const tagCounts = posts.reduce((acc: Map<string, number>, post) => {
    (post.tags || []).forEach((tag) => {
      const cleaned = tag?.trim();
      if (!cleaned) return;
      acc.set(cleaned, (acc.get(cleaned) || 0) + 1);
    });
    return acc;
  }, new Map<string, number>());

  const getTime = (value?: string, fallback?: string) => {
    const target = value || fallback;
    return target ? new Date(target).getTime() : 0;
  };

  const popularityScore = (post: BlogPost) =>
    (post.tags || []).reduce((score: number, tag: string) => {
      const cleaned = tag?.trim();
      if (!cleaned) return score;
      return score + (tagCounts.get(cleaned) || 0);
    }, 0);

  const sortedPosts =
    activeSort === "popular"
      ? [...posts].sort((a, b) => {
          const scoreDiff = popularityScore(b) - popularityScore(a);
          if (scoreDiff !== 0) return scoreDiff;
          return (
            getTime(b.publishedAt, b._createdAt) -
            getTime(a.publishedAt, a._createdAt)
          );
        })
      : activeSort === "recent"
        ? [...posts].sort(
            (a, b) =>
              getTime(b.publishedAt, b._createdAt) -
              getTime(a.publishedAt, a._createdAt),
          )
        : posts;


  const popularTags = Array.from(tagCounts.entries())
    .sort(
      ([tagA, countA], [tagB, countB]) =>
        countB - countA || tagA.localeCompare(tagB),
    )
    .slice(0, 16)
    .map(([tag]) => tag);

  const { items, pagination } = paginate(sortedPosts, params.page);

  return <ArticleArchive posts={items} pagination={pagination} categories={categories || []} tags={popularTags} query={query} activeSort={activeSort} />;
}
