import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

import { AdSlot } from "@/components/ads/ad-slot";
import { PageHero } from "@/components/page-hero";
import { trendingBlogsQuery, categoriesQuery } from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { formatDate } from "@/utils/date";
import { siteName } from "@/utils/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Trending Anime Articles and Popular Reads",
  description:
    "Discover the most read and trending anime articles on AnimeSparks including popular reviews lists and current anime discussions.",
  alternates: {
    canonical: "/trending",
  },
  openGraph: {
    title: "Trending Anime Articles and Popular Reads",
    description:
      "Discover the most read and trending anime articles on AnimeSparks including popular reviews lists and current anime discussions.",
    url: "/trending",
    type: "website",
    siteName,
    images: [{ url: "/trending-poster.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Anime Articles and Popular Reads",
    description:
      "Discover the most read and trending anime articles on AnimeSparks including popular reviews lists and current anime discussions.",
    images: ["/trending-poster.jpg"],
  },
};

type TrendingCategory = {
  _id: string;
  title: string;
  slug: string;
};

type TrendingPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: TrendingCategory[];
};

export default async function TrendingPage() {
  const trending = await client.fetch<TrendingPost[]>(trendingBlogsQuery);
  const categories = await client.fetch<TrendingCategory[]>(categoriesQuery);

  const topTrending = trending?.[0] ?? null;
  const hotStories = trending?.slice(1, 7) ?? [];
  const moreTrending = trending?.slice(7) ?? [];

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="What's Hot Right Now"
        title="Trending Blogs"
        description="The most read and debated anime stories on AnimeSparks. Pure signal — no filler."
        backgroundImage="/trending-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 space-y-10">
        <AdSlot variant="full" className="mb-6" />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-8 space-y-10">
            {topTrending && (
              <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-5 md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f20d0d] text-xl font-black text-white">
                    1
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                    #1 Trending Now
                  </h2>
                </div>
                <Link href={`/blog/${topTrending.slug}`} className="group block">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {topTrending.mainImage?.asset?.url && (
                      <div className="relative h-72 w-full overflow-hidden bg-black">
                        <Image
                          src={sanityHeroImageUrl(topTrending.mainImage)}
                          alt={topTrending.mainImage.alt || topTrending.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 1200px"
                          fetchPriority="high"
                          quality={60}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#f20d0d] px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[4px_4px_0px_0px_#000]">
                            Trending
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col justify-center gap-3">
                      {topTrending.categories?.[0] && (
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ccff00]">
                          {topTrending.categories[0].title}
                        </span>
                      )}
                      <h3 className="text-3xl md:text-4xl font-black uppercase leading-tight text-white group-hover:text-[#ccff00] transition-colors">
                        {topTrending.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        The most talked-about story on our platform right now.
                      </p>
                      <div className="text-xs font-mono uppercase text-gray-500">
                        {formatDate(topTrending.publishedAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#ccff00]" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  Hot Right Now
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {hotStories.map((post: TrendingPost, index: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group relative overflow-hidden border border-[#1f1f1f] bg-[#0b0b0b] transition-all hover:border-[#ccff00]"
                  >
                    {post.mainImage?.asset?.url && (
                      <div className="relative h-56 w-full overflow-hidden bg-black">
                        <Image
                          src={sanityImageUrl(post.mainImage, { width: 800 })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          sizes="(max-width: 768px) 92vw, 420px"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f20d0d] text-sm font-black text-white shadow-lg">
                          {index + 2}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      {post.categories?.[0] && (
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                          {post.categories[0].title}
                        </span>
                      )}
                      <h3 className="text-lg font-black uppercase leading-tight text-white line-clamp-2 group-hover:text-[#ccff00] transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span className="flex items-center gap-1 text-[#ccff00]">
                          Trending
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <AdSlot variant="inline" className="my-8" />

            {moreTrending.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#f20d0d]" />
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                    More Trending Blogs
                  </h2>
                </div>

                <div className="space-y-4">
                  {moreTrending.map((post: TrendingPost, index: number) => (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col gap-4 border border-[#1f1f1f] bg-[#0b0b0b] p-4 md:flex-row md:items-center md:gap-5 transition-colors hover:border-[#ccff00]"
                    >
                      <div className="text-sm font-black uppercase tracking-[0.2em] text-[#ccff00]">
                        #{index + 8}
                      </div>
                      {post.mainImage?.asset?.url ? (
                        <div className="relative h-40 w-full overflow-hidden bg-black md:h-24 md:w-40">
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
                        {post.categories?.[0] && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                            {post.categories[0].title}
                          </span>
                        )}
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
              </section>
            )}
          </div>

          <aside className="md:col-span-4 space-y-6">
            {categories.length > 0 && (
              <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                  Browse by Category
                </h3>
                <div className="space-y-2">
                  {categories.map((cat: TrendingCategory) => (
                    <Link
                      key={cat._id}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-center justify-between border-b border-[#1f1f1f] pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-[#ccff00] transition-colors">
                        {cat.title}
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-[#ccff00] transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <AdSlot variant="sidebar" />

            <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-6">
              <h3 className="text-lg font-black uppercase text-white">
                Stay in the Loop
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Weekly digest of what’s rising and why it matters.
              </p>
              <form className="mt-4 space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full rounded-sm border border-[#2a2a2a] bg-black px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#ccff00] focus:outline-none focus:ring-1 focus:ring-[#ccff00]"
                />
                <button
                  type="submit"
                  className="w-full rounded-sm bg-[#f20d0d] px-4 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ccff00] hover:text-black"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-500">
                No spam — just the best performing stories.
              </p>
            </section>

            <AdSlot variant="sidebar" />
          </aside>
        </div>
      </div>
    </main>
  );
}
