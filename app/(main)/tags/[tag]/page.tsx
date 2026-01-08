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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  if (!tag) return {};

  const decodedTag = decodeTag(tag).trim();
  const safeTag = encodeURIComponent(decodedTag);
  const baseTitle = "Anime Topics and Tags on AnimeSparks";
  const title = decodedTag ? `${baseTitle}: ${decodedTag}` : baseTitle;
  const description = decodedTag
    ? `Browse anime articles by topic on ${siteName}, including ${decodedTag} reviews lists and editorials.`
    : "Browse anime articles by topic including reviews seasonal anime sports anime and psychological series.";
  const canonical = `/tags/${safeTag}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-center gap-2">
                    {decodedTag ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                        {decodedTag}
                      </span>
                    ) : null}
                    <h3 className="text-xl font-black uppercase leading-tight text-white transition-colors group-hover:text-[#ccff00] sm:text-2xl">
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
