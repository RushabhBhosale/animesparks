import {
  categoriesQuery,
  latestBlogsQuery,
  trendingBlogsQuery,
} from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import { formatDate } from "@/utils/date";
import { defaultOgImage, siteName } from "@/utils/seo";
import { AdSlot } from "@/components/ads/ad-slot";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AnimeSparks Anime Reviews Lists and Editorials",
  description:
    "AnimeSparks is a personal anime editorial blog featuring honest reviews curated lists character breakdowns and thoughtful anime commentary.",
  alternates: {
    canonical: "/home",
  },
  openGraph: {
    title: "AnimeSparks Anime Reviews Lists and Editorials",
    description:
      "AnimeSparks is a personal anime editorial blog featuring honest reviews curated lists character breakdowns and thoughtful anime commentary.",
    url: "/home",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimeSparks Anime Reviews Lists and Editorials",
    description:
      "AnimeSparks is a personal anime editorial blog featuring honest reviews curated lists character breakdowns and thoughtful anime commentary.",
    images: [defaultOgImage],
  },
};

export default async function Home() {
  const latest = await client.fetch(latestBlogsQuery);
  const trending = await client.fetch(trendingBlogsQuery);
  const categories = await client.fetch(categoriesQuery);

  const featured = latest?.[0] ?? null;
  const latestPosts = latest?.slice(1, 25) ?? [];
  const moreStories = latestPosts.length > 6 ? latestPosts.slice(6, 14) : latestPosts;

  return (
    <main className="min-h-screen bg-white">
      {/* Featured Hero - Optimized Height */}
      {featured && (
        <section className="relative bg-black">
          <Link href={`/blog/${featured.slug}`} className="block group">
            {featured.mainImage?.asset?.url && (
              <div className="relative h-64 sm:h-96 lg:h-[500px] w-full overflow-hidden">
                <img
                  src={featured.mainImage.asset.url}
                  alt={featured.mainImage.alt || featured.title}
                  className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-90 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-12">
              <div className="mx-auto max-w-7xl">
                <div className="inline-block rounded bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white mb-2">
                  Featured
                </div>
                <h1 className="text-2xl font-black text-white sm:text-3xl lg:text-5xl leading-tight max-w-4xl">
                  {featured.title}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-gray-300 font-medium">
                  {formatDate(featured.publishedAt)}
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Trending Blogs - Grid Layout */}
        {trending.length > 0 && (
          <section className="mb-8 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 bg-red-600 rounded-full" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-900">
                Trending Now
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {trending.slice(0, 4).map((post: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/blog/${post.slug}`}
                  className="group relative no-underline!"
                >
                  {post.mainImage?.asset?.url && (
                    <div className="relative h-32 sm:h-40 lg:h-48 w-full overflow-hidden rounded-sm bg-gray-200">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-2 left-2 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-sm bg-red-600 text-xs sm:text-sm font-black text-white">
                        {idx + 1}
                      </div>
                    </div>
                  )}
                  <h3 className="mt-2 text-xs sm:text-sm lg:text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <AdSlot variant="full" className="mb-8" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8 lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Mixed Layout */}
          <div className="space-y-6 md:col-span-8 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 bg-red-600 rounded-full" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-900">
                Latest Blogs
              </h2>
            </div>

            {/* First 2 posts - Large cards on mobile */}
            {latestPosts.slice(0, 2).map((post: any, idx: number) => (
              <Link
                key={idx}
                href={`/blog/${post.slug}`}
                className="group block border-b border-gray-200 pb-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {post.mainImage?.asset?.url && (
                    <div className="relative h-48 md:h-32 md:w-48 lg:h-40 lg:w-64 shrink-0 overflow-hidden rounded-sm bg-gray-200">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight line-clamp-3 group-hover:text-red-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {/* Next 6 posts - 2 column grid on mobile */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 border-b border-gray-200 pb-6">
              {latestPosts.slice(2, 8).map((post: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  {post.mainImage?.asset?.url && (
                    <div className="relative h-32 sm:h-40 w-full overflow-hidden rounded-sm bg-gray-200">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <h3 className="mt-2 text-xs sm:text-sm lg:text-base font-bold text-gray-900 leading-tight line-clamp-3 group-hover:text-red-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 font-medium">
                    {formatDate(post.publishedAt)}
                  </p>
                </Link>
              ))}
            </div>

            <AdSlot variant="inline" className="py-4" />

            {/* Next 6 posts - Compact list */}
            <div className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-6 md:grid-cols-2 lg:grid-cols-1">
              {latestPosts.slice(8, 14).map((post: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/blog/${post.slug}`}
                  className="group flex gap-3"
                >
                  {post.mainImage?.asset?.url && (
                    <div className="relative h-20 w-28 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded-sm bg-gray-200">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 font-medium">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 no-underline! rounded-sm bg-red-600 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-white! transition-colors hover:bg-red-700"
              >
                View All Articles
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 md:col-span-4 lg:col-span-1">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="rounded-sm border border-gray-200 p-4">
                <h3 className="mb-3 text-base sm:text-lg font-black uppercase tracking-tight text-gray-900">
                  Categories
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                  {categories.slice(0, 10).map((cat: any) => (
                    <Link
                      key={cat._id}
                      href={`/categories/${cat.slug}`}
                      className="block border-b border-gray-100 pb-2 text-xs sm:text-sm font-semibold text-gray-700 transition-colors hover:text-red-600 last:border-0"
                    >
                      {cat.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <AdSlot variant="sidebar" />

            <div className="hidden lg:block">
              <div className="sticky top-24">
                <AdSlot variant="sidebar" />
              </div>
            </div>

            {/* More Blogs Sidebar */}
            {moreStories.length > 0 && (
              <div className="rounded-sm border border-gray-200 p-4">
                <h3 className="mb-3 text-base sm:text-lg font-black uppercase tracking-tight text-gray-900">
                  More Blogs
                </h3>
                <div className="space-y-4">
                  {moreStories.map((post: any) => (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group block"
                    >
                      <div className="flex gap-3">
                        {post.mainImage?.asset?.url && (
                          <div className="relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-sm bg-gray-200">
                            <img
                              src={post.mainImage.asset.url}
                              alt={post.mainImage.alt || post.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                            {post.title}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(post.publishedAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
