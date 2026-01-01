import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { blogsQuery, categoriesQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Browse all AnimeSparks posts: reviews, rankings, lists, and story analysis.",
  alternates: {
    canonical: "/blogs",
  },
  openGraph: {
    title: "Blogs",
    description:
      "Browse all AnimeSparks posts: reviews, rankings, lists, and story analysis.",
    url: "/blogs",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blogs",
    description:
      "Browse all AnimeSparks posts: reviews, rankings, lists, and story analysis.",
    images: [defaultOgImage],
  },
};

export default async function AllBlogsPage() {
  const blogs = await client.fetch(blogsQuery);
  const categories = await client.fetch(categoriesQuery);

  const featured = blogs?.[0] ?? null;
  const allPosts = blogs?.slice(1) ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/blogs-poster.jpg")',
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              Latest Articles
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            All Blogs
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Browse every article, review, and analysis from AnimeSparks, updated
            regularly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Featured Top Post */}
            {featured && (
              <div className="group mb-10 border-b border-gray-200 pb-10">
                <Link href={`/blog/${featured.slug}`} className="block">
                  {featured.mainImage?.asset?.url && (
                    <div className="relative h-87.5 w-full overflow-hidden rounded-sm bg-gray-200 lg:h-112.5">
                      <img
                        src={featured.mainImage.asset.url}
                        alt={featured.mainImage.alt || featured.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-block rounded-sm bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                          Featured
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
                <div className="mt-5">
                  {featured.categories?.[0] && (
                    <Link
                      href={`/categories/${featured.categories[0].slug}`}
                      className="inline-block text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                    >
                      {featured.categories[0].title}
                    </Link>
                  )}
                  <Link href={`/blog/${featured.slug}`} className="block">
                    <h2 className="mt-2 text-3xl font-black leading-tight text-gray-900 transition-colors group-hover:text-red-600 md:text-4xl">
                      {featured.title}
                    </h2>
                  </Link>
                  <p className="mt-3 text-sm font-medium text-gray-500">
                    {formatDate(featured.publishedAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="mb-8 flex items-center gap-4 border-b border-gray-200 overflow-x-auto pb-0">
              <button className="shrink-0 border-b-2 border-red-600 pb-3 text-sm font-bold uppercase tracking-wide text-red-600">
                All Posts
              </button>
              <button className="shrink-0 pb-3 text-sm font-bold uppercase tracking-wide text-gray-500 hover:text-gray-900 transition-colors">
                Most Recent
              </button>
              <button className="shrink-0 pb-3 text-sm font-bold uppercase tracking-wide text-gray-500 hover:text-gray-900 transition-colors">
                Popular
              </button>
            </div>

            {/* All Posts Grid */}
            <div className="space-y-8">
              {allPosts.map((post: any, index: number) => {
                // Every 4th post gets a larger layout
                const isLarge = (index + 1) % 4 === 0;

                if (isLarge) {
                  return (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group block border-b border-gray-200 pb-8"
                    >
                      {post.mainImage?.asset?.url && (
                        <div className="relative h-75 w-full overflow-hidden rounded-sm bg-gray-200">
                          <img
                            src={post.mainImage.asset.url}
                            alt={post.mainImage.alt || post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="mt-4">
                        {post.categories?.[0] && (
                          <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                            {post.categories[0].title}
                          </span>
                        )}
                        <h3 className="mt-2 text-2xl font-black leading-tight text-gray-900 group-hover:text-red-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group block border-b border-gray-200 pb-8"
                  >
                    <div className="flex gap-5">
                      {post.mainImage?.asset?.url && (
                        <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-sm bg-gray-200 sm:h-40 sm:w-64">
                          <img
                            src={post.mainImage.asset.url}
                            alt={post.mainImage.alt || post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex flex-col justify-center">
                        {post.categories?.[0] && (
                          <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                            {post.categories[0].title}
                          </span>
                        )}
                        <h3 className="mt-1 text-xl font-bold leading-tight text-gray-900 line-clamp-3 group-hover:text-red-600 transition-colors sm:text-2xl">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load More Button */}
            <div className="mt-10 text-center">
              <button className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700">
                Load More Articles
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              {/* Categories */}
              {categories.length > 0 && (
                <section className="rounded-sm border border-gray-200 bg-white p-5">
                  <h3 className="mb-5 text-lg font-black uppercase tracking-tight text-gray-900">
                    Browse by Category
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat: any) => (
                      <Link
                        key={cat._id}
                        href={`/categories/${cat.slug}`}
                        className="group flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors">
                          {cat.title}
                        </span>
                        <svg
                          className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-red-600"
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

              {/* Newsletter */}
              <section className="rounded-sm border-2 border-red-600 bg-white p-6">
                <h3 className="text-lg font-black text-gray-900">
                  Never Miss a Story
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Subscribe to our newsletter for the latest updates and
                  exclusive content.
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
                    Subscribe Now
                  </button>
                </form>
                <p className="mt-3 text-xs text-gray-500">
                  By subscribing, you agree to our Privacy Policy and consent to
                  receive updates.
                </p>
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

              {/* Popular Tags */}
              <section className="rounded-sm border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-gray-900">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Gaming",
                    "Movies",
                    "TV Shows",
                    "Comics",
                    "Anime",
                    "News",
                    "Reviews",
                    "Features",
                  ].map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${tag.toLowerCase()}`}
                      className="rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </section>

              {/* Social Follow */}
              <section className="rounded-sm border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-gray-900">
                  Follow Us
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="#"
                    className="flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                    </svg>
                    Instagram
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube
                  </a>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
