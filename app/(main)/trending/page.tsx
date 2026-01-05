import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { sanityImageUrl } from "@/sanity/lib/image";
import { trendingBlogsQuery, categoriesQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import type { Metadata } from "next";
import { siteName } from "@/utils/seo";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Trending",
  description:
    "The most-read AnimeSparks posts right now: popular reviews, lists, and analysis.",
  alternates: {
    canonical: "/trending",
  },
  openGraph: {
    title: "Trending",
    description:
      "The most-read AnimeSparks posts right now: popular reviews, lists, and analysis.",
    url: "/trending",
    type: "website",
    siteName,
    images: [{ url: "/trending-poster.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending",
    description:
      "The most-read AnimeSparks posts right now: popular reviews, lists, and analysis.",
    images: ["/trending-poster.jpg"],
  },
};

export default async function TrendingPage() {
  const trending = await client.fetch(trendingBlogsQuery);
  const categories = await client.fetch(categoriesQuery);

  const topTrending = trending?.[0] ?? null;
  const hotStories = trending?.slice(1, 7) ?? [];
  const moreTrending = trending?.slice(7) ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-linear-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/trending-poster.jpg")',
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              What's Hot Right Now
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Trending Stories
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            The most popular articles everyone is talking about right now.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {/* Top Trending - Full Width Feature */}
        {topTrending && (
          <section className="mb-12 border-b-4 border-red-600 pb-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-xl font-black text-white">
                1
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                #1 Trending Now
              </h2>
            </div>
            <Link href={`/blog/${topTrending.slug}`} className="group block">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {topTrending.mainImage?.asset?.url && (
                  <div className="relative h-87.5 w-full overflow-hidden rounded-sm bg-gray-200 lg:h-112.5">
                    <Image
                      src={sanityImageUrl(topTrending.mainImage, { width: 1600 })}
                      alt={topTrending.mainImage.alt || topTrending.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Trending
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  {topTrending.categories?.[0] && (
                    <span className="inline-block text-sm font-bold uppercase tracking-wider text-red-600">
                      {topTrending.categories[0].title}
                    </span>
                  )}
                  <h3 className="mt-3 text-4xl font-black leading-tight text-gray-900 group-hover:text-red-600 transition-colors md:text-5xl">
                    {topTrending.title}
                  </h3>
                  <p className="mt-4 text-base text-gray-600 leading-relaxed">
                    The most talked-about story on our platform right now
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-sm font-medium text-gray-500">
                    <span>{formatDate(topTrending.publishedAt)}</span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      12.5K Views
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Hot Stories Grid */}
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.59 11.32 12.71 11.7 12.93 12.05C13.5 13 14.49 13.64 15.3 14.36C15.5 14.55 15.71 14.75 15.86 14.97C16.5 15.85 16.57 17.05 15.94 17.9C15.65 18.25 15.19 18.67 14.5 17.5Z" />
                </svg>
                <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                  Hot Right Now
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {hotStories.map((post: any, index: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group relative overflow-hidden rounded-sm border-2 border-gray-200 bg-white transition-all hover:border-red-600 hover:shadow-lg"
                  >
                    {post.mainImage?.asset?.url && (
                      <div className="relative h-56 w-full overflow-hidden bg-gray-200">
                        <Image
                          src={sanityImageUrl(post.mainImage, { width: 800 })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          sizes="(max-width: 768px) 92vw, 420px"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white shadow-lg">
                          {index + 2}
                        </div>
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <div className="p-4">
                      {post.categories?.[0] && (
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                          {post.categories[0].title}
                        </span>
                      )}
                      <h3 className="mt-2 text-lg font-bold leading-tight text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {post.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Trending
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* More Trending */}
            {moreTrending.length > 0 && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-1 bg-red-600 rounded-full" />
                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                      More Trending Stories
                    </h2>
                  </div>
                </div>

                <div className="space-y-6">
                  {moreTrending.map((post: any, index: number) => (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group flex gap-5 border-b border-gray-200 pb-6"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-xl font-black text-gray-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      {index + 8}
                    </div>
                    {post.mainImage?.asset?.url && (
                      <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-sm bg-gray-200 sm:h-36 sm:w-56">
                        <Image
                          src={sanityImageUrl(post.mainImage, { width: 800 })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          sizes="(max-width: 768px) 92vw, 420px"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-center">
                      {post.categories?.[0] && (
                          <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                            {post.categories[0].title}
                          </span>
                        )}
                        <h3 className="mt-1 text-xl font-bold leading-tight text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              {/* Trending Stats */}
              <section className="rounded-sm border-2 border-red-600 bg-linear-to-br from-red-50 to-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                  </svg>
                  <h3 className="text-lg font-black uppercase text-gray-900">
                    Trending Stats
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-red-600">
                      {trending.length}
                    </span>
                    <span className="text-sm font-semibold text-gray-600">
                      Trending Articles
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-red-600">
                      500K+
                    </span>
                    <span className="text-sm font-semibold text-gray-600">
                      Total Views
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-red-600">
                      24h
                    </span>
                    <span className="text-sm font-semibold text-gray-600">
                      Updated
                    </span>
                  </div>
                </div>
              </section>

              {/* Categories */}
              {categories.length > 0 && (
                <section className="rounded-sm border border-gray-200 bg-white p-5">
                  <h3 className="mb-5 text-lg font-black uppercase tracking-tight text-gray-900">
                    Browse Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.slice(0, 8).map((cat: any) => (
                      <Link
                        key={cat._id}
                        href={`/categories/${cat.slug}`}
                        className="group flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors">
                          {cat.title}
                        </span>
                        <svg
                          className="h-4 w-4 text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-red-600"
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
                    ))}
                  </div>
                </section>
              )}

              {/* Why Trending Box */}
              <section className="rounded-sm border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-gray-900">
                  Why Are These Trending?
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <svg
                      className="h-5 w-5 shrink-0 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Most viewed in the last 24 hours</span>
                  </li>
                  <li className="flex gap-2">
                    <svg
                      className="h-5 w-5 shrink-0 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Highest engagement rates</span>
                  </li>
                  <li className="flex gap-2">
                    <svg
                      className="h-5 w-5 shrink-0 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Most shared on social media</span>
                  </li>
                  <li className="flex gap-2">
                    <svg
                      className="h-5 w-5 shrink-0 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Updated regularly throughout the day</span>
                  </li>
                </ul>
              </section>

              {/* Newsletter */}
              <section className="rounded-sm border-2 border-red-600 bg-white p-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-black text-gray-900">
                    Never Miss What's Trending
                  </h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Get daily updates on the hottest stories.
                </p>
                <form className="mt-4 space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full rounded-sm border border-gray-300 px-4 py-2.5 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </section>

              {/* Ad Space */}
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-semibold uppercase text-gray-400">
                  Advertisement
                </p>
                <div className="mt-4 flex h-64 items-center justify-center rounded-sm bg-gray-200">
                  <span className="text-gray-400">300x250</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
