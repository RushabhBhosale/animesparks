import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";

import { client } from "@/sanity/lib/client";
import { sanityHeroImageUrl } from "@/sanity/lib/image";
import { blogsQuery, categoriesQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import { AdSlot } from "@/components/ads/ad-slot";
import { defaultOgImage, siteName } from "@/utils/seo";
import { PageHero } from "@/components/page-hero";
import { BlogListContent } from "./blog-list-content";
import type { BlogCategory, BlogPost } from "./types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Anime Blog Reviews Lists and Anime News",
  description:
    "Browse all anime articles on AnimeSparks including reviews watchlists season updates and in depth anime editorials.",
  alternates: {
    canonical: "/blogs",
  },
  openGraph: {
    title: "Anime Blog Reviews Lists and Anime News",
    description:
      "Browse all anime articles on AnimeSparks including reviews watchlists season updates and in depth anime editorials.",
    url: "/blogs",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Blog Reviews Lists and Anime News",
    description:
      "Browse all anime articles on AnimeSparks including reviews watchlists season updates and in depth anime editorials.",
    images: [defaultOgImage],
  },
};

export default async function AllBlogsPage({
  searchParams,
}: {
  searchParams?: { sort?: string };
}) {
  const { sort } = searchParams || {};
  const activeSort =
    sort === "popular" ? "popular" : sort === "recent" ? "recent" : "all";

  const blogs = await client.fetch<BlogPost[]>(blogsQuery);
  const categories = await client.fetch<BlogCategory[]>(categoriesQuery);

  const posts = blogs ?? [];

  const tagCounts = posts.reduce((acc: Map<string, number>, post) => {
    (post.tags || []).forEach((tag) => {
      const cleaned = tag?.trim();
      if (!cleaned) return;
      acc.set(cleaned, (acc.get(cleaned) || 0) + 1);
    });
    return acc;
  }, new Map<string, number>());

  const getTime = (value?: string, fallback?: string) => {
    const target = value || fallback;
    return target ? new Date(target).getTime() : 0;
  };

  const popularityScore = (post: BlogPost) =>
    (post.tags || []).reduce((score: number, tag: string) => {
      const cleaned = tag?.trim();
      if (!cleaned) return score;
      return score + (tagCounts.get(cleaned) || 0);
    }, 0);

  const sortedPosts =
    activeSort === "popular"
      ? [...posts].sort((a, b) => {
          const scoreDiff = popularityScore(b) - popularityScore(a);
          if (scoreDiff !== 0) return scoreDiff;
          return (
            getTime(b.publishedAt, b._createdAt) -
            getTime(a.publishedAt, a._createdAt)
          );
        })
      : activeSort === "recent"
        ? [...posts].sort(
            (a, b) =>
              getTime(b.publishedAt, b._createdAt) -
              getTime(a.publishedAt, a._createdAt)
          )
        : posts;

  const featured = sortedPosts[0] ?? null;
  const allPosts = sortedPosts.slice(1);

  const popularTags = Array.from(tagCounts.entries())
    .sort(
      ([tagA, countA], [tagB, countB]) =>
        countB - countA || tagA.localeCompare(tagB)
    )
    .slice(0, 16)
    .map(([tag]) => tag);

  return (
    <main className="min-h-screen bg-anime-ink text-anime-text selection:bg-anime-lime selection:text-black">
      <div className="w-full px-4 py-12 md:px-8 2xl:px-12 space-y-12">
        <div className="relative mb-16 md:mb-24 overflow-hidden">
          {/* faint background word (optional, helps match vibe) */}
          <div className="pointer-events-none absolute -top-10 left-0 text-[120px] md:text-[220px] font-black uppercase tracking-tight text-white/5">
            ARCHIVE
          </div>

          <div className="relative">
            {/* ALL + FEED */}
            <h1 className="relative z-10 leading-[0.82]">
              <span className="block text-7xl md:text-9xl font-black uppercase italic tracking-tighter text-white">
                ALL
              </span>

              <span className="block -mt-2 md:-mt-6">
                <span
                  className="
            inline-block text-7xl md:text-9xl font-black uppercase italic tracking-tighter
            text-transparent
            [text-shadow:none]
            [-webkit-text-stroke:2px_#f20d0d]
          "
                >
                  FEED
                </span>
              </span>
            </h1>

            {/* terminal card */}
            <div className="absolute left-[58%] top-[58%] md:left-[54%] md:top-[52%] -translate-y-1/2 z-20">
              <div
                className="
          relative bg-anime-red text-white
          border-2 border-white
          shadow-[6px_6px_0px_0px_#00f3ff]
          px-4 py-3
          rotate-[-2deg]
          w-[260px] md:w-[320px]
        "
              >
                <div className="text-[11px] md:text-xs font-mono uppercase leading-relaxed tracking-[0.18em]">
                  <div>&gt;_ 00{allPosts.length} articles found</div>
                  <div>&gt;_ sort: chronological</div>
                  <div>&gt;_ status: synced</div>
                </div>
              </div>
            </div>
          </div>

          {/* tabs row */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {/* SYS filter */}
            <div className="flex items-center gap-2 border border-white/15 bg-black/50 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-anime-lime shadow-[0_0_0_2px_rgba(204,255,0,0.15)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                SYS_FILTER:
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-anime-red">
                ALL_DEPT
              </span>
            </div>

            {/* right status bar */}
            <div className="ml-auto hidden md:flex items-center gap-3 border border-white/15 bg-black/40 px-4 py-2">
              <span className="h-4 w-[2px] bg-anime-red" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                ENCRYPTION: AES-256
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-anime-lime">
                CONNECTED
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* LEFT */}
          <div className="md:col-span-8 space-y-10">
            {/* Featured dossier */}
            {featured && (
              <section className="relative ob-panel border-2 border-white/15 bg-anime-panel p-4 md:p-6 shadow-hard-white">
                <div className="absolute -top-4 -left-4 bg-anime-lime text-black font-black text-sm px-4 py-2 border-2 border-black shadow-hard z-20 uppercase tracking-[0.14em]">
                  Featured
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  <div className="md:col-span-7 relative bg-black border border-white/10">
                    {featured.mainImage?.asset?.url && (
                      <div className="relative h-64 w-full md:h-full overflow-hidden">
                        <Image
                          src={sanityHeroImageUrl(featured.mainImage)}
                          alt={featured.mainImage.alt || featured.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 960px"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                      </div>
                    )}

                    <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />

                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-anime-red px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-hard-white border-2 border-black">
                        Featured
                      </span>
                      {featured.categories?.[0] && (
                        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-200">
                          {featured.categories[0].title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-center gap-4">
                    <Link href={`/blog/${featured.slug}`} className="group">
                      <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight tracking-tight text-white group-hover:text-anime-lime transition-colors">
                        {featured.title}
                      </h2>
                    </Link>

                    <p className="text-[10px] font-mono uppercase text-anime-muted-subtle">
                      {formatDate(featured.publishedAt)}
                    </p>

                    <p className="text-base text-anime-muted">
                      {featured.excerpt ??
                        "An editorial spotlight chosen by our team. Expect strong takes and thoughtful analysis."}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/blog/${featured.slug}`}
                        className="bg-anime-red text-white hover:text-black font-black uppercase tracking-wider px-8 py-4 text-sm hover:bg-[#ccff00] transition-all shadow-[8px_8px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                      >
                        Read Feature
                      </Link>

                      {featured.categories?.[0] && (
                        <Link
                          href={`/categories/${featured.categories[0].slug}`}
                          className="inline-flex items-center gap-2 bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white border-2 border-white/15 hover:border-anime-lime hover:text-anime-lime transition-colors"
                        >
                          {featured.categories[0].title}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Sort controls */}
            <section className="space-y-8">
              <div className="flex flex-wrap gap-4 items-center border-b border-white/10 pb-6">
                <Link
                  href="/blogs"
                  scroll={false}
                  aria-current={activeSort === "all" ? "page" : undefined}
                  className={clsx(
                    "px-6 py-3 font-black uppercase tracking-[0.18em] text-sm border-2 transition-all",
                    activeSort === "all"
                      ? "bg-anime-lime text-black border-white shadow-hard"
                      : "bg-black text-white border-white/20 hover:border-anime-lime hover:text-anime-lime"
                  )}
                >
                  All Posts
                </Link>

                {/* <Link
                  href="/blogs?sort=recent"
                  scroll={false}
                  aria-current={activeSort === "recent" ? "page" : undefined}
                  className={clsx(
                    "px-6 py-3 font-black uppercase tracking-[0.18em] text-sm border-2 transition-all",
                    activeSort === "recent"
                      ? "bg-anime-cyan text-black border-white shadow-hard-blue"
                      : "bg-black text-white border-white/20 hover:border-anime-cyan hover:text-anime-cyan"
                  )}
                >
                  Most Recent
                </Link>

                <Link
                  href="/blogs?sort=popular"
                  scroll={false}
                  aria-current={activeSort === "popular" ? "page" : undefined}
                  className={clsx(
                    "px-6 py-3 font-black uppercase tracking-[0.18em] text-sm border-2 transition-all",
                    activeSort === "popular"
                      ? "bg-anime-red text-white border-black shadow-hard-white"
                      : "bg-black text-white border-white/20 hover:border-anime-red hover:text-anime-red"
                  )}
                >
                  Popular
                </Link> */}

                <div className="ml-auto hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                  <span className="h-[10px] w-[10px] bg-anime-red border border-black" />
                  {/* <span className="h-[10px] w-[10px] bg-anime-cyan border border-black" />
                  <span className="h-[10px] w-[10px] bg-anime-lime border border-black" /> */}
                  <span>Case Files</span>
                </div>
              </div>

              {/* Posts list */}
              <BlogListContent
                posts={allPosts}
                initialVisible={featured ? 9 : 10}
              />

              <AdSlot variant="inline" className="mt-8" />
            </section>
          </div>

          {/* RIGHT */}
          <aside className="md:col-span-4">
            <div className="md:sticky md:top-24 space-y-6">
              {categories.length > 0 && (
                <section className="relative ob-panel border-2 border-white/10 bg-anime-panel p-5 shadow-hard-white">
                  <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />
                  <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                    Browse by Category
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat: BlogCategory) => (
                      <Link
                        key={cat._id}
                        href={`/categories/${cat.slug}`}
                        className="group flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm font-semibold text-gray-200 group-hover:text-anime-lime transition-colors">
                          {cat.title}
                        </span>
                        <span className="text-xs text-white/50 group-hover:text-anime-lime transition-colors">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <AdSlot variant="sidebar" />

              <section className="relative ob-panel border-2 border-white/10 bg-anime-panel p-6 shadow-hard-white">
                <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-10 bg-white/10 border border-white/10" />
                <h3 className="text-lg font-black uppercase text-white">
                  Never Miss a Blog
                </h3>
                <p className="mt-2 text-sm text-anime-muted">
                  Subscribe for editorials, breakdowns, and trending anime
                  stories.
                </p>
                <form className="mt-4 space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full border-2 border-white/15 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-anime-lime focus:outline-none focus:ring-1 focus:ring-anime-lime"
                  />
                  <button
                    type="submit"
                    className="bg-anime-red text-white hover:text-black font-black uppercase tracking-wider px-8 py-4 text-sm hover:bg-[#ccff00] transition-all shadow-[8px_8px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    Subscribe Now
                  </button>
                </form>
                <p className="mt-3 text-xs text-white/40">
                  Zero spam. Only the stories worth reading.
                </p>
              </section>

              <AdSlot variant="sidebar" />

              {popularTags.length > 0 && (
                <section className="relative ob-panel border-2 border-white/10 bg-anime-panel p-5 shadow-hard-white">
                  <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />
                  <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                    Popular Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="border-2 border-white/10 bg-black px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white/80 hover:border-anime-lime hover:text-anime-lime transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="relative ob-panel border-2 border-white/10 bg-anime-panel p-5 shadow-hard-white">
                <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                  Follow Us
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Facebook", "Twitter", "Instagram", "YouTube"].map(
                    (label) => (
                      <a
                        key={label}
                        href="#"
                        className="flex items-center justify-center border-2 border-white/10 bg-black px-3 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-white/80 hover:border-anime-lime hover:text-anime-lime transition-colors"
                      >
                        {label}
                      </a>
                    )
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
