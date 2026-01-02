import {
  categoriesQuery,
  latestBlogsQuery,
  trendingBlogsQuery,
} from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import { formatDate } from "@/utils/date";
import { defaultOgImage, siteName } from "@/utils/seo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "AnimeSparks is a focused anime editorial blog with reviews, lists, and character analysis.",
  alternates: {
    canonical: "/home",
  },
  openGraph: {
    title: "Home",
    description:
      "AnimeSparks is a focused anime editorial blog with reviews, lists, and character analysis.",
    url: "/home",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home",
    description:
      "AnimeSparks is a focused anime editorial blog with reviews, lists, and character analysis.",
    images: [defaultOgImage],
  },
};

export default async function Home() {
  const latest = await client.fetch(latestBlogsQuery);
  const trending = await client.fetch(trendingBlogsQuery);
  const categories = await client.fetch(categoriesQuery);

  const featured = latest?.[0] ?? null;
  const latestPosts = latest?.slice(1, 13) ?? [];

  console.log("featured", featured);

  return (
    <main className="min-h-screen bg-white">
      {/* Featured Hero - Full Width */}
      {featured && (
        <section className="relative bg-black">
          <Link href={`/blog/${featured.slug}`} className="block group">
            {featured.mainImage?.asset?.url && (
              <div className="relative h-125 w-full overflow-hidden lg:h-150">
                <img
                  src={featured.mainImage.asset.url}
                  alt={featured.mainImage.alt || featured.title}
                  className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-90 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-8 md:pb-12">
              <div className="mx-auto max-w-7xl">
                <div className="inline-block rounded bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white mb-3">
                  Featured
                </div>
                <h1 className="text-3xl font-black text-white md:text-5xl lg:text-6xl leading-tight max-w-4xl">
                  {featured.title}
                </h1>
                <p className="mt-3 text-sm text-gray-300 font-medium">
                  {formatDate(featured.publishedAt)}
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Trending Stories - Horizontal Scroll */}
        {trending.length > 0 && (
          <section className="mb-10 border-b border-gray-200 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-1 w-1 bg-red-600 rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                Trending Now
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trending.slice(0, 4).map((post: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/blog/${post.slug}`}
                  className="group relative no-underline!"
                >
                  {post.mainImage?.asset?.url && (
                    <div className="relative h-48 w-full overflow-hidden rounded-sm bg-gray-200">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-sm bg-red-600 text-sm font-black text-white">
                        {idx + 1}
                      </div>
                    </div>
                  )}
                  <h3 className="mt-3 text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Left Column - Large Cards */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-1 bg-red-600 rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                Latest Stories
              </h2>
            </div>

            {latestPosts.slice(0, 6).map((post: any, idx: number) => (
              <Link
                key={idx}
                href={`/blog/${post.slug}`}
                className="group block border-b border-gray-200 pb-8 last:border-0"
              >
                <div className="flex gap-5">
                  {post.mainImage?.asset?.url && (
                    <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-sm bg-gray-200 sm:h-40 sm:w-64">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-3 group-hover:text-red-600 transition-colors sm:text-2xl">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 font-medium">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            <div className="pt-4">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 no-underline! rounded-sm bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white! transition-colors hover:bg-red-700"
              >
                View All Articles
                <svg
                  className="h-4 w-4"
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
          <div className="space-y-8">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="rounded-sm border border-gray-200 p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-gray-900">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.slice(0, 8).map((cat: any) => (
                    <Link
                      key={cat._id}
                      href={`/categories/${cat.slug}`}
                      className="block border-b border-gray-100 pb-2 text-sm font-semibold text-gray-700 transition-colors hover:text-red-600 last:border-0"
                    >
                      {cat.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* More Stories Sidebar */}
            <div className="rounded-sm border border-gray-200 p-5">
              <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-gray-900">
                More Stories
              </h3>
              <div className="space-y-5">
                {latestPosts.slice(6, 12).map((post: any) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <div className="flex gap-3">
                      {post.mainImage?.asset?.url && (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm bg-gray-200">
                          <img
                            src={post.mainImage.asset.url}
                            alt={post.mainImage.alt || post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
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
          </div>
        </div>
      </div>
    </main>
  );
}
