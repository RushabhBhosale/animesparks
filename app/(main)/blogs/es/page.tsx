import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { BlogListContent } from "../blog-list-content";
import type { BlogCategory, BlogPost } from "../types";
import { client } from "@/sanity/lib/client";
import { categoriesQuery, spanishBlogsQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import { canonicalizeSearchValue } from "@/utils/search-index";
import { defaultOgImage, siteName } from "@/utils/seo";

export const revalidate = 60;

const metaTitle = "Anime Articles in Spanish";
const metaDescription =
  "Browse AnimeSparks articles in Spanish, including analysis, explanations, and editorial deep dives.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/blogs/es",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/blogs/es",
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

export default async function SpanishBlogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.toLowerCase().trim();
  const normalizedQuery = query ? canonicalizeSearchValue(query) : "";

  const blogs = await client.fetch<BlogPost[]>(spanishBlogsQuery);
  const categories = await client.fetch<BlogCategory[]>(categoriesQuery);

  const posts = (blogs ?? []).filter((post) => {
    if (!normalizedQuery) return true;
    const content = [post.title, post.metaDescription || post.excerpt]
      .filter(Boolean)
      .map((entry) => canonicalizeSearchValue(entry || ""))
      .join(" ");
    return content.includes(normalizedQuery);
  });

  const featured = posts[0] ?? null;
  const allPosts = posts.slice(1);

  return (
    <main className="min-h-screen bg-anime-ink text-anime-text selection:bg-anime-lime selection:text-black">
      <div className="w-full px-4 py-12 md:px-8 2xl:px-12 space-y-12">
        <div className="relative mb-16 overflow-hidden md:mb-24">
          <div className="pointer-events-none absolute -top-10 left-0 text-[110px] font-black uppercase tracking-tight text-white/5 md:text-[200px]">
            ESPANOL
          </div>

          <div className="relative space-y-8">
            <div className="space-y-4">
              <span className="inline-flex border border-white/15 bg-black/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#f20d0d]">
                Archivo ES
              </span>
              <h1 className="leading-[0.82]">
                <span className="block text-6xl font-black uppercase italic tracking-tighter text-white md:text-8xl">
                  BLOGS
                </span>
                <span className="block -mt-2 text-6xl font-black uppercase italic tracking-tighter text-transparent [-webkit-text-stroke:2px_#f20d0d] md:-mt-5 md:text-8xl">
                  EN ESPANOL
                </span>
              </h1>
              <p className="max-w-3xl text-sm text-anime-muted md:text-base">
                Browse the Spanish archive for translated and Spanish-first AnimeSparks
                case files without leaving the main editorial flow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                Archive
              </span>
              <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.03] p-1">
                <Link
                  href="/blogs"
                  className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70 transition-colors md:hover:bg-white/10 md:hover:text-white"
                >
                  EN
                </Link>
                <span className="rounded-full bg-[#f20d0d] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  ES
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="space-y-10 md:col-span-8">
            {featured ? (
              <section className="relative border-2 border-white/15 bg-anime-panel p-4 shadow-hard-white md:p-6">
                <div className="absolute -left-4 -top-4 bg-[#f20d0d] px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-white shadow-hard">
                  Destacado
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  <div className="relative border border-white/10 bg-black md:col-span-7">
                    {featured.mainImage?.asset?.url ? (
                      <div className="relative h-64 w-full overflow-hidden md:h-full">
                        <Image
                          src={featured.mainImage.asset.url}
                          alt={featured.mainImage.alt || featured.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 960px"
                          className="object-cover transition-transform duration-500 md:hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                      </div>
                    ) : null}

                    {featured.categories?.[0] ? (
                      <div className="absolute left-4 top-4">
                        <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                          {featured.categories[0].title}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col justify-center gap-4 md:col-span-5">
                    <Link href={`/blog/es/${featured.slug}`} className="group">
                      <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-white transition-colors md:text-4xl md:group-hover:text-anime-lime">
                        {featured.title}
                      </h2>
                    </Link>

                    {featured.publishedAt ? (
                      <p className="text-[10px] font-mono uppercase text-anime-muted-subtle">
                        {formatDate(featured.publishedAt)}
                      </p>
                    ) : null}

                    <p className="text-base text-anime-muted">
                      {featured.excerpt ||
                        "A highlighted Spanish dossier selected from the current archive."}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/blog/es/${featured.slug}`}
                        className="bg-anime-red px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition-all shadow-[8px_8px_0px_0px_#fff] md:hover:translate-x-1 md:hover:translate-y-1 md:hover:bg-[#ccff00] md:hover:text-black md:hover:shadow-none"
                      >
                        Leer
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="space-y-8">
              <div className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-6">
                <span className="border-2 border-white bg-[#f20d0d] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-hard-white">
                  Spanish Blogs
                </span>
                <div className="ml-auto hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/60 md:flex">
                  <span className="h-[10px] w-[10px] border border-black bg-[#f20d0d]" />
                  <span>Archivo activo</span>
                </div>
              </div>

              <BlogListContent
                posts={allPosts}
                initialVisible={featured ? 9 : 10}
                locale="es"
              />
            </section>
          </div>

          <aside className="md:col-span-4">
            <div className="space-y-6 md:sticky md:top-24">
              {categories.length > 0 ? (
                <section className="relative border-2 border-white/10 bg-anime-panel p-5 shadow-hard-white">
                  <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/categories/${cat.slug}`}
                        className="group flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm font-semibold text-gray-200 transition-colors md:group-hover:text-anime-lime">
                          {cat.title}
                        </span>
                        <span className="text-xs text-white/50 transition-colors md:group-hover:text-anime-lime">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="relative border-2 border-white/10 bg-anime-panel p-5 shadow-hard-white">
                <h3 className="text-lg font-black uppercase text-white">
                  Language Switch
                </h3>
                <p className="mt-2 text-sm text-anime-muted">
                  Jump back to the English archive whenever you want to compare the
                  broader editorial feed.
                </p>
                <div className="mt-4 inline-flex overflow-hidden rounded-full border border-white/10 bg-black p-1">
                  <Link
                    href="/blogs"
                    className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70 transition-colors md:hover:bg-white/10 md:hover:text-white"
                  >
                    EN
                  </Link>
                  <span className="rounded-full bg-[#f20d0d] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    ES
                  </span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
