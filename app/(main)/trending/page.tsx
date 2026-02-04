import type { Metadata } from "next";

import { client } from "@/sanity/lib/client";
import { blogsQuery } from "@/sanity/blogQueries";
import { sanityHeroImageUrl } from "@/sanity/lib/image";
import { defaultOgImage, getBaseUrl, siteName } from "@/utils/seo";
import { TrendingContent } from "./trending-content";
import type { BlogPost, TrendingRange } from "./types";
import { fetchGaPageViews } from "@/lib/analytics";

export const revalidate = 60;

const metaTitle = "Trending Anime Articles Right Now";
const metaDescription =
  "Discover the most read and talked-about anime articles on AnimeSparks, updated with what fans are engaging with right now.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/trending",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/trending",
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

type FilterValue = "recent" | "popular" | "discussed" | "visual" | "all";
const DAY_MS = 1000 * 60 * 60 * 24;

export default async function TrendingPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string | string[]; range?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const rangeParam = Array.isArray(params.range)
    ? params.range[0]
    : params.range;
  const rangeValue: TrendingRange = (() => {
    switch ((rangeParam || "").toLowerCase()) {
      case "week":
        return "week";
      case "year":
        return "year";
      case "month":
      default:
        return "month";
    }
  })();
  const posts = (await client.fetch<BlogPost[]>(blogsQuery)) ?? [];

  const slugs = posts.map((post) => post.slug).filter(Boolean);
  const gaViews = await fetchGaPageViews(slugs);
  const hasGaViews = Object.keys(gaViews).length > 0;
  const postsWithViews = posts.map((post) => ({
    ...post,
    viewCount: hasGaViews ? gaViews[post.slug] ?? 0 : undefined,
  }));

  const tagCounts = postsWithViews.reduce((acc, post) => {
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

  const filterByRange = (list: BlogPost[]) => {
    const windowDays = rangeValue === "week" ? 7 : rangeValue === "year" ? 365 : 30;
    const cutoff = Date.now() - windowDays * DAY_MS;
    const scoped = list.filter(
      (post) => getTime(post.publishedAt, post._createdAt) >= cutoff
    );
    return scoped.length ? scoped : list;
  };

  const postsInRange = filterByRange(postsWithViews);

  const filterValue: FilterValue = (() => {
    switch ((sort || "").toLowerCase()) {
      case "recent":
        return "recent";
      case "popular":
        return "popular";
      case "discussed":
        return "discussed";
      case "visual":
        return "visual";
      default:
        return "popular";
    }
  })();

  const sortByRecent = [...postsInRange].sort(
    (a, b) =>
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
  );

  const sortByPopularity = [...postsInRange].sort((a, b) => {
    const viewsDiff = (b.viewCount ?? 0) - (a.viewCount ?? 0);
    if (viewsDiff !== 0) return viewsDiff;
    const diff = popularityScore(b) - popularityScore(a);
    if (diff !== 0) return diff;
    return (
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
    );
  });

  const sortByDiscussed = [...postsInRange].sort((a, b) => {
    const scoreA =
      (a.viewCount ?? 0) * 0.5 + popularityScore(a) + (a.tags?.length ?? 0);
    const scoreB =
      (b.viewCount ?? 0) * 0.5 + popularityScore(b) + (b.tags?.length ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
    );
  });

  const visualPosts = postsInRange.filter((post) =>
    (post.categories || []).some((category) => {
      const label = category?.title?.toLowerCase() || "";
      return (
        category?.slug === "visuals" ||
        label.includes("visual") ||
        label.includes("art")
      );
    })
  );

  const sortedPosts =
    filterValue === "recent"
      ? sortByRecent
      : filterValue === "popular"
        ? sortByPopularity
        : filterValue === "discussed"
      ? sortByDiscussed
      : filterValue === "visual"
        ? visualPosts.length
          ? visualPosts
          : sortByRecent
          : postsInRange;

  if (!sortedPosts.length) {
    return (
      <main className="min-h-screen bg-[#050505] text-[#f0f0f0] font-display bg-grid selection:bg-[#ccff00] selection:text-black">
        <div className="pt-10 md:pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">
              Trending intel will appear soon.
            </h1>
            <p className="mt-4 text-gray-400">
              We are curating the top articles now. Check again shortly for the
              latest drops.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const baseUrl = getBaseUrl();
  const initialSelection = sortedPosts.slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Trending",
        item: `${baseUrl}/trending`,
      },
    ],
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: initialSelection.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.publishedAt ?? post._createdAt,
        url: `${baseUrl}/blog/${post.slug}`,
        description: post.excerpt,
        image: post.mainImage ? sanityHeroImageUrl(post.mainImage) : undefined,
        author: {
          "@type": "Person",
          name: post.author?.name ?? siteName,
        },
      },
    })),
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#f0f0f0] font-display selection:bg-[#ccff00] selection:text-black">
      <script
        key="breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        key="item-list"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
      />

      <TrendingContent posts={sortedPosts} range={rangeValue} currentSort={filterValue} />
    </main>
  );
}
