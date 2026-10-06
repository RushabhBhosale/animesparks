import { Pagination } from "@/components/pagination";
import { paginate, withListingMetadata, type ListingSearchParams } from "@/lib/pagination";
import { EditorialCard } from "@/components/editorial-card";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { client } from "@/lib/content/client";
import { blogsByTagQuery } from "@/sanity/blogQueries";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { cache } from "react";
import { PageHero } from "@/components/page-hero";

export const revalidate = 60;
const TAG_INDEX_THRESHOLD = 3;

type TagPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

const decodeTag = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const tagMetaPresets = [
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

const getTagPosts = cache(async (tag: string): Promise<TagPost[]> => {
  if (!tag) return [];
  return client.fetch<TagPost[]>(blogsByTagQuery, { tagValue: tag });
});

const resolveTagMeta = (
  tagValue: string,
  fallbackTitle: string,
  fallbackDescription: string
) => {
  const preset = tagMetaPresets.find((entry) =>
    entry.keys.includes(normalizeKey(tagValue))
  );

  return preset || { title: fallbackTitle, description: fallbackDescription };
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams?: Promise<ListingSearchParams>;
}): Promise<Metadata> {
  const { tag } = await params;
  if (!tag) return {};

  const decodedTag = decodeTag(tag).trim();
  const safeTag = encodeURIComponent(decodedTag);
  const posts = decodedTag ? await getTagPosts(decodedTag) : [];
  const shouldIndex = posts.length >= TAG_INDEX_THRESHOLD;
  const fallbackTitle = decodedTag
    ? `Anime Tag: ${decodedTag} | ${siteName}`
    : `Anime Tags | ${siteName}`;
  const fallbackDescription = decodedTag
    ? `Explore anime articles tagged ${decodedTag} — reviews, opinions, lists, and news from ${siteName}.`
    : "Browse anime articles by tag — reviews, breakdowns, opinions, lists, and news across anime genres.";
  const canonical = `/tags/${safeTag}`;
  const meta = decodedTag
    ? resolveTagMeta(decodedTag, fallbackTitle, fallbackDescription)
    : { title: fallbackTitle, description: fallbackDescription };

  return withListingMetadata({
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical,
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
      },
    },
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

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams?: Promise<ListingSearchParams>;
}) {
  const { tag } = await params;
  const decodedTag = decodeTag(tag || "").trim();
  const posts = await getTagPosts(decodedTag);
  const { items, pagination } = paginate(posts, (await searchParams)?.page);

  return (
    <main className="bg-anime-ink text-anime-text">
      <PageHero eyebrow="From the archive" title={decodedTag || "Explore topics"} description={decodedTag ? `Stories, analysis, and perspectives on ${decodedTag}.` : "Discover articles by topic."} />
      <div className="editorial-shell editorial-archive">
        <div className="editorial-section-heading"><h2 className="text-xl font-bold">Related reading</h2><Link href="/blogs">All articles <ArrowUpRight size={16} /></Link></div>
        {posts.length ? <div className="editorial-grid">{items.map((post, index) => <EditorialCard key={post._id} post={post} priority={index === 0} />)}</div> : <p className="py-8 text-sm text-white/65">No articles for this topic yet.</p>}
        <Pagination pagination={pagination} path={`/tags/${encodeURIComponent(decodedTag)}`} />
      </div>
    </main>
  );
}
