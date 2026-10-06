import { Pagination } from "@/components/pagination";
import { paginate, withListingMetadata, type ListingSearchParams } from "@/lib/pagination";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { client } from "@/lib/content/client";
import {
  blogsByCategoryQuery,
  categoryBySlugQuery,
} from "@/sanity/blogQueries";
import { defaultOgImage, siteName } from "@/utils/seo";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { EditorialCard } from "@/components/editorial-card";

export const revalidate = 60;

type Category = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
};

type CategoryPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  _createdAt?: string;
  excerpt?: string;
  tags?: string[];
  categories?: Array<{ title?: string; slug?: string; _id?: string }>;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

const getCategory = cache(async (slug: string) =>
  client.fetch<Category | null>(categoryBySlugQuery, { slug }),
);

const getDescription = (category: Category) =>
  category.description?.trim() || `Posts in ${category.title} on ${siteName}.`;

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categoryMetaPresets = [
  {
    keys: ["anime-reviews", "reviews"],
    title: "Anime Reviews — Honest Takes on Popular & Underrated Series",
    description:
      "In-depth anime reviews focused on story, characters, themes, and execution — covering both mainstream hits and overlooked series.",
  },
  {
    keys: ["anime-opinions", "opinions", "hot-takes"],
    title: "Anime Opinions & Hot Takes That Go Deeper",
    description:
      "Thought-provoking anime opinions exploring themes, character choices, power systems, and storytelling decisions across popular series.",
  },
  {
    keys: ["anime-lists", "lists", "rankings"],
    title: "Anime Lists — Recommendations, Rankings & Hidden Gems",
    description:
      "Curated anime lists featuring recommendations, rankings, underrated picks, and must-watch series across multiple genres.",
  },
  {
    keys: ["anime-news-updates", "anime-news", "news-updates", "news"],
    title: "Anime News, Release Dates & Updates",
    description:
      "Latest anime news, release dates, episode schedules, and confirmed updates — clearly explained without rumors or filler.",
  },
  {
    keys: [
      "psychological-anime",
      "dark-anime",
      "dark-psychological-anime",
      "psychological",
    ],
    title: "Dark & Psychological Anime — Themes That Hit Hard",
    description:
      "Anime focused on psychological depth, moral conflict, isolation, and darker storytelling that stays with you long after watching.",
  },
  {
    keys: ["isekai", "isekai-anime"],
    title: "Isekai Anime — Power Fantasies, Parody & Deconstruction",
    description:
      "Explore isekai anime ranging from dark power fantasies to genre-aware parody, with thoughtful breakdowns and comparisons.",
  },
];

const resolveCategoryMeta = (
  category: Category,
  fallbackTitle: string,
  fallbackDescription: string,
) => {
  const keys = [category.title, category.slug].filter(Boolean);
  const preset = categoryMetaPresets.find((entry) =>
    keys.some((key) => entry.keys.includes(normalizeKey(key))),
  );

  return preset || { title: fallbackTitle, description: fallbackDescription };
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<ListingSearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};

  const category = await getCategory(slug);
  if (!category?._id) return { title: "Category Not Found" };

  const description = getDescription(category);
  const canonical = `/categories/${category.slug || slug}`;

  const meta = resolveCategoryMeta(
    category,
    `Category: ${category.title}`,
    description,
  );

  return withListingMetadata({
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      type: "website",
      siteName,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [defaultOgImage],
    },
  }, canonical, (await searchParams) || {});
}

const getTime = (v?: string) => (v ? new Date(v).getTime() : 0);

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    sort?: string | string[];
    page?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const sortParam = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;

  if (!slug) return notFound();

  const category = await getCategory(slug);
  if (!category?._id) return notFound();

  const posts: CategoryPost[] = await client.fetch(blogsByCategoryQuery, {
    slug,
  });

  const sortKey =
    sortParam === "popular"
      ? "popular"
      : sortParam === "newest"
        ? "newest"
        : "newest";

  const sorted = [...(posts || [])].sort((a, b) => {
    if (sortKey === "popular") {
      const ta = (a.tags || []).length;
      const tb = (b.tags || []).length;
      if (tb !== ta) return tb - ta;
    }
    return (
      getTime(b.publishedAt || b._createdAt) -
      getTime(a.publishedAt || a._createdAt)
    );
  });

  const { items: visibleSorted, pagination } = paginate(sorted, sp.page);

  return (
    <main className="bg-anime-ink text-anime-text">
      <PageHero eyebrow="Editorial section" title={category.title} description={getDescription(category)} />
      <div className="editorial-shell editorial-archive">
        <div className="editorial-section-heading"><h2 className="text-xl font-bold">The latest in {category.title}</h2><Link href="/categories">All sections <ArrowUpRight size={16} /></Link></div>
        {visibleSorted.length ? <div className="editorial-grid">{visibleSorted.map((post, index) => <EditorialCard key={post._id} post={post} priority={index === 0} />)}</div> : <p className="py-8 text-sm text-white/65">No articles in this section yet. <Link href="/blogs" className="underline">Explore the archive</Link></p>}
        <Pagination pagination={pagination} path={`/categories/${category.slug}`} query={{ sort: sortParam }} />
      </div>
    </main>
  );
}
