import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { categoriesQuery, sitemapPageBlogsQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Browse the AnimeSparks site index and published posts.",
  alternates: {
    canonical: "/sitemap",
  },
  openGraph: {
    title: "Sitemap",
    description: "Browse the AnimeSparks site index and published posts.",
    url: "/sitemap",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sitemap",
    description: "Browse the AnimeSparks site index and published posts.",
    images: [defaultOgImage],
  },
};

type Category = {
  _id: string;
  title: string;
  slug: string;
};

type Blog = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
};

const coreLinks = [
  { label: "Home", href: "/home" },
  { label: "Blogs", href: "/blogs" },
  { label: "Categories", href: "/categories" },
  { label: "Trending", href: "/trending" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
];

export default async function SitemapPage() {
  const [categories, posts] = await Promise.all([
    client.fetch<Category[]>(categoriesQuery),
    client.fetch<Blog[]>(sitemapPageBlogsQuery),
  ]);

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
              Sitemap
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Site Index
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            A clean map of published posts and core sections.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-red-600" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Main Pages
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-sm border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-red-600 hover:text-red-600"
              >
                <span>{link.label}</span>
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

        {categories?.length ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-red-600" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                Categories
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug}`}
                  className="group rounded-sm border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-red-600 hover:text-red-600"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {posts?.length ? (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-red-600" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                Published Posts
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-sm border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900 transition-colors hover:text-red-600"
                >
                  <span className="block">{post.title}</span>
                  {post.publishedAt ? (
                    <span className="mt-1 block text-xs font-medium text-gray-500">
                      {formatDate(post.publishedAt)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
