import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { blogsByTagQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { sanityImageUrl } from "@/sanity/lib/image";
import Image from "next/image";

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
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-linear-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/anime-poster.jpg")',
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              Tag
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            {decodedTag ? `#${decodedTag}` : "Tagged Blogs"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            {decodedTag
              ? `Blogs tagged with ${decodedTag}.`
              : "Blogs grouped by tag."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <AdSlot variant="full" className="mb-10" />

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-red-600" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              {decodedTag ? "Blogs" : "Latest Blogs"}
            </h2>
          </div>

          {posts.length ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-1">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-4 border-b border-gray-200 pb-8 md:flex-row md:items-center"
                >
                  {post.mainImage?.asset?.url ? (
                    <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-sm bg-gray-200 md:h-32 md:w-56">
                      <Image
                        src={sanityImageUrl(post.mainImage, { width: 700, quality: 60 })}
                        alt={post.mainImage.alt || post.title}
                        fill
                        sizes="(max-width: 768px) 90vw, 320px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-center">
                    {decodedTag ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                        {decodedTag}
                      </span>
                    ) : null}
                    <h3 className="mt-2 text-xl font-black leading-tight text-gray-900 transition-colors group-hover:text-red-600 sm:text-2xl">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-600">
              No posts for this tag yet.
            </p>
          )}
        </section>

        <AdSlot variant="full" className="mt-10" />
      </div>
    </main>
  );
}
