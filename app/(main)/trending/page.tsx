import type { Metadata } from "next";

import { client } from "@/sanity/lib/client";
import { blogsQuery } from "@/sanity/blogQueries";
import { sanityHeroImageUrl } from "@/sanity/lib/image";
import { defaultOgImage, getBaseUrl, siteName } from "@/utils/seo";
import { TrendingContent } from "./trending-content";
import type { BlogPost } from "./types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Trending Anime Case Files",
  description:
    "A curated dossier of the top trending anime editorials, hot takes, and visual investigations from AnimeSparks.",
  alternates: {
    canonical: "/trending",
  },
  openGraph: {
    title: "Trending Anime Case Files",
    description:
      "A curated dossier of the top trending anime editorials, hot takes, and visual investigations from AnimeSparks.",
    url: "/trending",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Anime Case Files",
    description:
      "A curated dossier of the top trending anime editorials, hot takes, and visual investigations from AnimeSparks.",
    images: [defaultOgImage],
  },
};

type FilterValue = "recent" | "popular" | "discussed" | "visual" | "all";

export default async function TrendingPage({
  searchParams,
}: {
  searchParams?: { sort?: string };
}) {
  const { sort } = searchParams || {};
  const posts = (await client.fetch<BlogPost[]>(blogsQuery)) ?? [];

  const tagCounts = posts.reduce((acc, post) => {
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

  const sortByRecent = [...posts].sort(
    (a, b) =>
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
  );

  const sortByPopularity = [...posts].sort((a, b) => {
    const diff = popularityScore(b) - popularityScore(a);
    if (diff !== 0) return diff;
    return (
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
    );
  });

  const sortByDiscussed = [...posts].sort((a, b) => {
    const scoreA = popularityScore(a) + (a.tags?.length ?? 0);
    const scoreB = popularityScore(b) + (b.tags?.length ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
    );
  });

  const visualPosts = posts.filter((post) =>
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
            : posts;

  if (!sortedPosts.length) {
    return (
      <main className="min-h-screen bg-[#050505] text-[#f0f0f0] font-display bg-grid selection:bg-[#ccff00] selection:text-black">
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">
              Trending intel will appear soon.
            </h1>
            <p className="mt-4 text-gray-400">
              We are curating the top editorials now. Check again shortly for
              the dossier.
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
        item: `${baseUrl}/home`,
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

      <TrendingContent posts={sortedPosts} />
    </main>
  );
}
