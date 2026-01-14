import { client } from "@/sanity/lib/client";
import { blogsQuery } from "@/sanity/blogQueries";
import { fetchGaPageViews } from "@/lib/analytics";

type BlogCard = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  _createdAt?: string;
  excerpt?: string;
  tags?: string[];
  categories?: { _id: string; title: string; slug: string }[];
  mainImage?: { asset?: { url?: string }; alt?: string };
  author?: { name?: string };
  viewCount?: number;
};

const getTime = (value?: string, fallback?: string) => {
  const target = value || fallback;
  return target ? new Date(target).getTime() : 0;
};

const takeUniqueById = (posts: BlogCard[]) => {
  const used = new Set<string>();
  const out: BlogCard[] = [];
  for (const p of posts) {
    if (!p?._id || used.has(p._id)) continue;
    used.add(p._id);
    out.push(p);
  }
  return out;
};

export async function getTrendingPosts(options?: {
  limit?: number;
  revalidateFallbackToRecent?: boolean;
}) {
  const limit = options?.limit ?? 10;

  const posts = (await client.fetch<BlogCard[]>(blogsQuery)) ?? [];
  const slugs = posts.map((p) => p.slug).filter(Boolean);

  const gaViews = await fetchGaPageViews(slugs);
  const hasGaViews = Object.keys(gaViews).length > 0;

  const postsWithViews: BlogCard[] = posts.map((p) => ({
    ...p,
    viewCount: hasGaViews ? (gaViews[p.slug] ?? 0) : undefined,
  }));

  const tagCounts = postsWithViews.reduce((acc, post) => {
    (post.tags || []).forEach((tag) => {
      const cleaned = tag?.trim();
      if (!cleaned) return;
      acc.set(cleaned, (acc.get(cleaned) || 0) + 1);
    });
    return acc;
  }, new Map<string, number>());

  const popularityScore = (post: BlogCard) =>
    (post.tags || []).reduce((score, tag) => {
      const cleaned = tag?.trim();
      if (!cleaned) return score;
      return score + (tagCounts.get(cleaned) || 0);
    }, 0);

  const sorted = [...postsWithViews].sort((a, b) => {
    if (hasGaViews) {
      const viewsDiff = (b.viewCount ?? 0) - (a.viewCount ?? 0);
      if (viewsDiff !== 0) return viewsDiff;
    }
    const diff = popularityScore(b) - popularityScore(a);
    if (diff !== 0) return diff;

    return (
      getTime(b.publishedAt, b._createdAt) -
      getTime(a.publishedAt, a._createdAt)
    );
  });

  const unique = takeUniqueById(sorted);
  return {
    all: unique,
    collage: unique.slice(0, limit),
    mustReads: unique.slice(0, Math.min(5, limit)),
    hasGaViews,
  };
}
