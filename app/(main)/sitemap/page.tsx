import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { categoriesQuery, sitemapPageBlogsQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { PageHero } from "@/components/page-hero";

export const revalidate = 60;

const metaTitle = "Sitemap";
const metaDescription =
  "A complete sitemap of AnimeSparks to help users and search engines navigate all pages and anime content easily.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/sitemap",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/sitemap",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
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
  { label: "Home", href: "/" },
  { label: "Blogs", href: "/blogs" },
  { label: "My Anime List", href: "/my-anime-list" },
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
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Sitemap"
        title="Site Index"
        description="A clean map of published posts and core sections."
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#ccff00]" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Main Pages
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {coreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between border border-[#1f1f1f] bg-[#0b0b0b] px-4 py-3 text-sm font-semibold text-gray-200 transition-all md:hover:border-[#ccff00] md:hover:text-[#ccff00]"
              >
                <span>{link.label}</span>
                <span
                  aria-hidden
                  className="text-gray-500 transition-transform md:group-hover:translate-x-1 md:group-hover:text-[#ccff00]"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {categories?.length ? (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#f20d0d]" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Categories
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug}`}
                  className="group border border-[#1f1f1f] bg-[#0b0b0b] px-4 py-3 text-sm font-semibold text-gray-200 transition-all md:hover:border-[#ccff00] md:hover:text-[#ccff00]"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {posts?.length ? (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#ccff00]" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Published Posts
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group border border-[#1f1f1f] bg-[#0b0b0b] px-4 py-3 text-sm font-semibold text-gray-200 transition-colors md:hover:border-[#ccff00] md:hover:text-[#ccff00]"
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
