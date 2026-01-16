import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { blogsByTagQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { sanityImageUrl } from "@/sanity/lib/image";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";

export const revalidate = 60;

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
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  if (!tag) return {};

  const decodedTag = decodeTag(tag).trim();
  const safeTag = encodeURIComponent(decodedTag);
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

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical,
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
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeTag(tag || "").trim();
  const posts: TagPost[] = decodedTag
    ? await client.fetch(blogsByTagQuery, { tagValue: decodedTag })
    : [];

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Tag"
        title={decodedTag ? `#${decodedTag}` : "Tagged Blogs"}
        description={
          decodedTag
            ? `Blogs tagged with ${decodedTag}.`
            : "Blogs grouped by tag."
        }
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 space-y-8">
        <AdSlot variant="full" className="mb-8" />

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#ccff00]" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              {decodedTag ? "Blogs" : "Latest Blogs"}
            </h2>
          </div>

          {posts.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-4 border border-[#1f1f1f] bg-[#0b0b0b] p-4 md:flex-row md:items-center"
                >
                  {post.mainImage?.asset?.url ? (
                    <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-black md:h-32 md:w-56">
                      <Image
                        src={sanityImageUrl(post.mainImage, {
                          width: 700,
                          quality: 60,
                        })}
                        alt={post.mainImage.alt || post.title}
                        fill
                        sizes="(max-width: 768px) 90vw, 320px"
                        className="object-cover transition-transform duration-300 md:group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-center gap-2">
                    {decodedTag ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                        {decodedTag}
                      </span>
                    ) : null}
                    <h3 className="text-xl font-black uppercase leading-tight text-white transition-colors md:group-hover:text-[#ccff00] sm:text-2xl">
                      {post.title}
                    </h3>
                    <p className="text-xs font-mono uppercase text-gray-500">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-400">
              No posts for this tag yet.
            </p>
          )}
        </section>

        <AdSlot variant="full" className="mt-6" />
      </div>
    </main>
  );
}
