import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import { TrendingRail } from "@/components/trending-rail";
import {
  homepageSettingsQuery,
  latestBlogsQuery,
  trendingBlogsQuery,
} from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { formatDate, timeAgo } from "@/utils/date";
import { defaultOgImage, siteName } from "@/utils/seo";
import { bungeeOutline, splineSans } from "@/lib/font";
import { fetchGaPageViews } from "@/lib/analytics";
import Header from "@/components/header";
import Footer from "@/components/footer";
import clsx from "clsx";
import { getTrendingPosts } from "@/lib/trending";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AnimeSparks Anime Blog Home",
  description:
    "Deep dives, reviews, and trending anime stories from AnimeSparks. Explore the latest articles, character studies, and shonen breakdowns.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AnimeSparks Anime Blog Home",
    description:
      "Deep dives, reviews, and trending anime stories from AnimeSparks. Explore the latest articles, character studies, and shonen breakdowns.",
    url: "/",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimeSparks Anime Blog Home",
    description:
      "Deep dives, reviews, and trending anime stories from AnimeSparks.",
    images: [defaultOgImage],
  },
};

type BlogCard = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: {
    name?: string;
    image?: { asset?: { url?: string }; alt?: string };
  };
  viewCount?: number;
};

type HomepageSettings = {
  editorsPicks?: BlogCard[];
};

const getExcerpt = (text?: string, limit = 150) => {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
};

const editorShadows = [
  "shadow-[8px_8px_0px_0px_#f20d0d]",
  "shadow-[8px_8px_0px_0px_#00f3ff]",
  "shadow-[8px_8px_0px_0px_#ccff00]",
];

const editorTextHover = [
  "md:group-hover:text-[#f20d0d]",
  "md:group-hover:text-[#00f3ff]",
  "md:group-hover:text-[#ccff00]",
];

const takeUniqueById = (posts: BlogCard[], usedIds: Set<string>) => {
  const output: BlogCard[] = [];

  for (const post of posts) {
    if (!post?._id || usedIds.has(post._id)) continue;
    usedIds.add(post._id);
    output.push(post);
  }

  return output;
};

export default async function Home() {
  const [latest, homepageSettings, trendingPack] = await Promise.all([
    client.fetch<BlogCard[]>(latestBlogsQuery),
    client.fetch<HomepageSettings | null>(homepageSettingsQuery),
    getTrendingPosts({ limit: 10 }),
  ]);

  const latestPosts = Array.isArray(latest) ? latest : [];
  const trendingViews: any = Array.isArray([]) ? [] : [];
  const editorsConfigured = homepageSettings?.editorsPicks ?? [];

  const slugSet = new Set<string>();
  [...latestPosts, ...trendingViews, ...editorsConfigured].forEach((post) => {
    if (post?.slug) slugSet.add(post.slug);
  });

  const gaViews = await fetchGaPageViews(Array.from(slugSet));
  const hasGaViews = Object.keys(gaViews).length > 0;
  const withViews = (post: BlogCard) => ({
    ...post,
    viewCount: hasGaViews ? (gaViews[post.slug] ?? 0) : undefined,
  });

  const latestWithViews = latestPosts.map(withViews);
  const trendingWithViews = trendingViews.map(withViews);
  const editorsWithViews = editorsConfigured.map(withViews);

  const featured =
    editorsWithViews[0] ?? trendingWithViews[0] ?? latestWithViews[0] ?? null;

  const baseUsed = new Set<string>();
  if (featured?._id) baseUsed.add(featured._id);

  const editorsSource =
    editorsWithViews.length > 0 ? editorsWithViews : latestWithViews;
  const editorsPicks = takeUniqueById(editorsSource, new Set(baseUsed)).slice(
    0,
    3
  );

  const usedForLatest = new Set(baseUsed);
  editorsPicks.forEach((p) => {
    if (p?._id) usedForLatest.add(p._id);
  });

  let mainStream = takeUniqueById(latestWithViews, new Set(usedForLatest));
  let mainUpdates = mainStream.slice(0, 3);
  let moreUpdates = mainStream.slice(3, 6);

  if (mainUpdates.length === 0) {
    // fallback: show latest even if duplicates
    mainUpdates = latestWithViews.slice(0, 3);
    moreUpdates = latestWithViews.slice(3, 6);
  }

  const trendingCollage = trendingPack.collage;
  const mustReads = trendingPack.mustReads;

  const marqueeTitles = (
    trendingCollage.length ? trendingCollage : latestWithViews
  )
    .map((post) => post.title)
    .filter(Boolean);

  return (
    <>
      <Header />

      <main
        className={`${splineSans.className} bg-[#050505] text-[#f0f0f0] overflow-x-hidden`}
      >
        {/* fix any accidental horizontal overflow from rotated/marquee */}
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Hero */}
          <header className="relative w-full pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 md:px-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-2/3 h-full bg-[#f20d0d0d] -skew-x-12 z-0 pointer-events-none" />

            {/* decorative ANIME - smaller on mobile */}
            <div className="absolute top-12 sm:top-14 left-4 md:left-10 text-[6rem] sm:text-[9rem] md:text-[16rem] lg:text-[20rem] font-black text-white/5 select-none z-0 leading-none whitespace-nowrap pointer-events-none">
              ANIME
            </div>

            <div className="relative z-10 mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* LEFT */}
              <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 relative">
                <div className="absolute -left-12 -top-12 size-24 border-4 border-dashed border-[#2f2f2f] rounded-full animate-[spin_10s_linear_infinite] opacity-40 hidden lg:block" />

                {featured?.categories?.[0]?.title && (
                  <div className="inline-flex self-start bg-black border border-[#f20d0d] px-3 py-1 -rotate-2 shadow-hard">
                    <span className="text-[#f20d0d] font-black uppercase text-xs tracking-[0.2em]">
                      {featured.categories[0].title}
                    </span>
                  </div>
                )}

                {/* responsive title sizes + better wrap */}
                <h1 className="text-[2.15rem] leading-[0.95] sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase mix-blend-difference">
                  <span className="block break-words">
                    {(featured?.title || "Featured Story")
                      .split(/\s+/)
                      .map((word, i, arr) => {
                        const outline = (word.length + i) % 3 === 0;

                        return (
                          <span
                            key={`${word}-${i}`}
                            className={
                              outline
                                ? `${bungeeOutline.className} font-bungee-outline`
                                : ""
                            }
                          >
                            {word}
                            {i < arr.length - 1 ? " " : ""}
                          </span>
                        );
                      })}
                  </span>
                </h1>

                {featured?.excerpt && (
                  <p className="text-sm sm:text-base md:text-lg text-gray-300 font-medium max-w-xl border-l-4 border-[#ccff00] pl-4 sm:pl-6 py-2">
                    {getExcerpt(featured.excerpt, 190)}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mt-2 sm:mt-4">
                  {featured?.slug && (
                    <Link
                      prefetch={false}
                      href={`/blog/${featured.slug}`}
                      className="w-full sm:w-auto bg-white text-black font-black uppercase tracking-wider px-5 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm md:hover:bg-[#ccff00] transition-all shadow-hard md:hover:shadow-none md:hover:translate-x-1 md:hover:translate-y-1"
                      aria-label={`Read article: ${featured.title ?? "Featured story"}`}
                    >
                      Read Article
                    </Link>
                  )}

                  {featured?.categories?.[0]?.slug && (
                    <Link
                      href={`/categories/${featured.categories[0].slug}`}
                      className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-3 border border-[#2f2f2f] bg-black/60 backdrop-blur-sm rounded-full"
                    >
                      <span className="text-xs font-bold uppercase text-gray-300">
                        {featured.categories[0].title}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[#ccff00]" />
                    </Link>
                  )}
                </div>
              </div>

              {/* RIGHT IMAGE */}
              {featured?.mainImage?.asset?.url && (
                <div
                  className="lg:col-span-5 relative mt-2 sm:mt-6 lg:mt-0 group"
                  style={{ perspective: "1200px" }}
                >
                  <div className="relative z-20 bg-black p-2 transform transition-transform duration-500 lg:group-hover:rotate-2 lg:group-hover:scale-105 border-2 border-white/10">
                    {/* keep a solid aspect on mobile, not too tall */}
                    <div className="relative aspect-[4/5] sm:aspect-square w-full overflow-hidden bg-[#0c0c0c] md:grayscale lg:group-hover:grayscale-0 transition-all duration-500">
                      <Link prefetch={false} href={`/blog/${featured.slug}`}>
                        <Image
                          src={sanityHeroImageUrl(featured.mainImage)}
                          alt={featured.mainImage.alt || featured.title}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 620px"
                          className="object-cover"
                        />
                      </Link>
                    </div>

                    {/* badge: smaller + inside safe area on mobile */}
                    <div className="absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-6 bg-[#ccff00] text-black font-black text-2xl sm:text-4xl px-3 sm:px-4 py-2 transform -rotate-6 shadow-[6px_6px_0px_0px_white] z-30">
                      #01
                    </div>

                    {featured.categories?.[0]?.title && (
                      <div className="absolute top-4 -left-8 bg-[#00f3ff] text-black font-bold text-[10px] sm:text-xs px-3 py-1 transform -rotate-90 origin-bottom-right uppercase tracking-widest hidden sm:block">
                        {featured.categories[0].title}
                      </div>
                    )}
                  </div>

                  {/* offset border: reduce on mobile */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-full h-full border-4 border-[#f20d0d] z-10 -translate-x-3 translate-y-3 sm:-translate-x-4 sm:translate-y-4" />
                </div>
              )}
            </div>
          </header>

          {/* Marquee */}
          {marqueeTitles.length > 0 && (
            <div className="bg-[#f20d0d] overflow-hidden py-3 transform -rotate-1 origin-left w-[105%] -ml-2 border-y-4 border-black z-20 relative">
              <div className="whitespace-nowrap flex gap-10 marquee-track">
                {marqueeTitles.concat(marqueeTitles).map((title, idx) => (
                  <span
                    key={`${title}-${idx}`}
                    className="text-black font-black uppercase text-base sm:text-xl italic tracking-widest"
                  >
                    {"///"} {title} {"///"}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="relative w-full overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-16 md:py-20">
              {/* Trending */}
              {trendingCollage.length > 0 && (
                <TrendingRail posts={trendingCollage} />
              )}

              <div className="my-14 sm:my-20 md:my-24 border-t border-[#1f1f1f] relative">
                <span className="absolute top-1/2 left-1/2 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-4 text-gray-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em]">
                  Scroll Down for more
                </span>
              </div>

              {/* MAIN LAYOUT: stack on mobile, 2-col on lg */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
                {/* LEFT */}
                <section className="lg:col-span-8 space-y-10 sm:space-y-12 min-w-0">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase italic mb-4 sm:mb-6 pr-1 relative inline-block">
                    Latest <span className="font-bungee-outline">Updates</span>
                    <span className="absolute -right-3 -top-3 sm:-right-4 sm:-top-4 text-[#ccff00] text-4xl sm:text-6xl select-none">
                      *
                    </span>
                  </h3>

                  {mainUpdates.map((post, idx) => {
                    const badgeColors = ["#f20d0d", "#00f3ff", "#ccff00"];
                    const alignReverse = idx === 1;

                    return (
                      <article
                        key={post._id}
                        className={clsx(
                          "group relative pl-6 sm:pl-8 border-l-2 border-[#1f1f1f] transition-colors md:hover:border-[#f20d0d] min-w-0",
                          alignReverse ? "md:text-right" : ""
                        )}
                      >
                        <div className="absolute -left-2 top-0 size-4 bg-[#050505] border-2 border-[#3b3b3b] md:group-hover:border-[#f20d0d] md:group-hover:bg-[#f20d0d] transition-colors rounded-full" />

                        {/* stack on mobile, 2-col from md */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                          <div
                            className={clsx(
                              "relative overflow-hidden border border-[#2a2a2a] md:group-hover:border-[#f20d0d]/60 transition-colors",
                              alignReverse ? "md:order-2" : ""
                            )}
                          >
                            {post.mainImage?.asset?.url ? (
                              <div className="relative aspect-video">
                                <Link
                                  prefetch={false}
                                  href={`/blog/${post.slug}`}
                                  className="inline-flex items-center gap-2 text-[#f20d0d] font-bold uppercase text-xs tracking-widest md:hover:gap-4 transition-all"
                                  aria-label={`Read more about ${post.title ?? "this article"}`}
                                >
                                  <Image
                                    src={sanityImageUrl(post.mainImage, {
                                      width: 1200,
                                    })}
                                    alt={post.mainImage.alt || post.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 560px"
                                    className="object-cover transition-all duration-500"
                                  />
                                </Link>
                              </div>
                            ) : (
                              <div className="aspect-video bg-[#0c0c0c]" />
                            )}
                          </div>

                          <div
                            className={clsx(
                              "flex flex-col justify-center min-w-0",
                              alignReverse ? "md:order-1" : ""
                            )}
                          >
                            <div
                              className={clsx(
                                "flex flex-wrap gap-2 mb-3",
                                alignReverse
                                  ? "justify-start md:justify-end"
                                  : "justify-start"
                              )}
                            >
                              {post.categories?.[0]?.title && (
                                <span
                                  className="text-black text-[10px] font-black px-2 py-1 uppercase tracking-wider transform -skew-x-12"
                                  style={{
                                    backgroundColor:
                                      badgeColors[idx] ?? "#f20d0d",
                                  }}
                                >
                                  {post.categories[0].title}
                                </span>
                              )}
                              <span className="text-gray-500 text-xs font-mono py-1">
                                {timeAgo(post.publishedAt)}
                              </span>
                            </div>

                            <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase leading-tight sm:leading-none mb-3 transition-colors md:group-hover:text-white">
                              {post.title}
                            </h4>

                            {post.excerpt && (
                              <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                                {getExcerpt(post.excerpt, 160)}
                              </p>
                            )}

                            <Link
                              prefetch={false}
                              href={`/blog/${post.slug}`}
                              className="inline-flex items-center gap-2 text-[#f20d0d] font-bold uppercase text-xs tracking-widest md:hover:gap-4 transition-all"
                              aria-label={`Read more about ${post.title ?? "this article"}`}
                            >
                              Read More <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {moreUpdates.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      {moreUpdates.map((post) => (
                        <Link
                          prefetch={false}
                          href={`/blog/${post.slug}`}
                          key={post._id}
                        >
                          <article className="group relative pl-6 border-l-2 border-[#1f1f1f] md:hover:border-[#00f3ff] transition-colors">
                            <div className="absolute -left-2 top-0 size-4 bg-[#050505] border-2 border-[#3b3b3b] md:group-hover:border-[#00f3ff] md:group-hover:bg-[#00f3ff] transition-colors rounded-full" />
                            <div className="flex gap-4">
                              {post.mainImage?.asset?.url && (
                                <div className="relative h-20 w-28 sm:h-24 sm:w-32 overflow-hidden border border-[#2a2a2a] shrink-0">
                                  <Image
                                    src={sanityImageUrl(post.mainImage, {
                                      width: 600,
                                    })}
                                    alt={post.mainImage.alt || post.title}
                                    fill
                                    sizes="160px"
                                    className="object-cover transition-all duration-500"
                                  />
                                </div>
                              )}
                              <div className="flex flex-col justify-center min-w-0">
                                <h5 className="text-base sm:text-lg font-black uppercase leading-tight md:group-hover:text-[#00f3ff] transition-colors line-clamp-2">
                                  {post.title}
                                </h5>
                                <span className="text-xs text-gray-500 font-mono mt-1">
                                  {timeAgo(post.publishedAt) ||
                                    formatDate(post.publishedAt)}
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/blogs"
                    className="block text-center w-full bg-transparent border-2 border-[#2a2a2a] text-white font-black uppercase py-4 md:hover:bg-white md:hover:text-black transition-colors tracking-widest text-base sm:text-lg group"
                  >
                    Load More Chaos{" "}
                    <span className="inline-block transition-transform md:group-hover:rotate-180 ml-2">
                      +
                    </span>
                  </Link>
                </section>

                {/* RIGHT SIDEBAR: NOT sticky on mobile, sticky on lg */}
                <aside className="lg:col-span-4 space-y-10 lg:space-y-12 relative min-w-0">
                  <div className="lg:sticky lg:top-24 space-y-8">
                    {/* Merch */}
                    <div className="bg-[#f20d0d] p-1 shadow-[8px_8px_0px_0px_rgba(242,13,13,0.7)] lg:hover:translate-x-1 lg:hover:translate-y-1 lg:hover:shadow-none transition-all cursor-pointer group">
                      <div className="bg-black p-6 h-56 sm:h-64 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,#2d2d2d_1px,transparent_1px)] [background-size:14px_14px]" />
                        <h4 className="text-2xl font-black text-white uppercase italic z-10">
                          Anime
                          <br />
                          Merch
                        </h4>
                        <p className="text-gray-400 text-xs mb-4 z-10">
                          Limited Edition Drops
                        </p>
                        <button className="bg-white text-black text-xs font-bold uppercase px-4 py-2 z-10 md:group-hover:bg-[#f20d0d] md:group-hover:text-white transition-colors">
                          Shop Now
                        </button>
                      </div>
                    </div>

                    {/* Must Reads */}
                    {mustReads.length > 0 && (
                      <div className="bg-[#121212] border border-[#2a2a2a] p-6 relative">
                        <div className="absolute -top-3 -right-3 bg-[#ccff00] text-black px-2 py-1 font-black text-xs uppercase rotate-3 border border-black">
                          Must Reads
                        </div>
                        <h4 className="font-bold text-gray-500 uppercase text-xs tracking-widest mb-6">
                          Popular this week
                        </h4>
                        <div className="space-y-4">
                          {mustReads.map((post, idx) => (
                            <Link
                              prefetch={false}
                              key={post._id}
                              href={`/blog/${post.slug}`}
                              className="flex gap-4 items-start group"
                            >
                              <span className="text-3xl sm:text-4xl font-black text-[#2c2c2c] md:group-hover:text-[#f20d0d] transition-colors italic shrink-0 leading-none">
                                {idx + 1}
                              </span>
                              <p className="text-sm font-bold text-white leading-tight md:group-hover:translate-x-1 transition-transform line-clamp-2">
                                {post.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Newsletter */}
                    <div className="border-2 border-white p-6 transform lg:-rotate-2 bg-black">
                      <h4 className="text-2xl sm:text-3xl font-black uppercase text-white mb-2 text-center">
                        Join the
                        <br />
                        <span className="text-[#f20d0d]">Squad</span>
                      </h4>
                      <p className="text-xs text-center text-gray-400 mb-4">
                        No spam, just pure chaos.
                      </p>
                      <input
                        type="email"
                        name="email"
                        className="w-full bg-[#0e0e0e] border-none text-white text-center font-bold text-sm py-3 mb-2 focus:ring-2 focus:ring-[#f20d0d] uppercase placeholder-gray-600"
                        placeholder="YOUR EMAIL"
                      />
                      <button className="w-full bg-[#f20d0d] text-white font-black uppercase py-3 md:hover:bg-red-700 transition-colors">
                        Subscribe
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {/* Editor Picks */}
            {editorsPicks.length > 0 && (
              <section className="bg-[#f0f0f0] text-black py-14 sm:py-16 md:py-20 transform -skew-y-2 origin-top-left border-y-8 border-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 transform skew-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10 sm:mb-12">
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter">
                      Editors <br />
                      <span className="text-[#f20d0d]">Picks</span>
                    </h3>
                    <ArrowDown className="h-10 w-10 sm:h-14 sm:w-14 animate-bounce self-start sm:self-auto" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {editorsPicks.map((post, idx) => {
                      const accent =
                        ["#f20d0d", "#00f3ff", "#ccff00"][idx] ?? "#f20d0d";
                      const shadowClass =
                        editorShadows[idx] ??
                        "shadow-[8px_8px_0px_0px_#f20d0d]";
                      const hoverText =
                        editorTextHover[idx] ?? "md:group-hover:text-[#f20d0d]";

                      return (
                        <Link
                          prefetch={false}
                          key={post._id}
                          href={`/blog/${post.slug}`}
                          className={`group cursor-pointer ${
                            idx === 1 ? "md:-mt-12" : ""
                          }`}
                        >
                          <div
                            className={`overflow-hidden border-4 border-black ${shadowClass} md:hover:shadow-none md:hover:translate-x-2 md:hover:translate-y-2 transition-all bg-black h-72 sm:h-80 relative`}
                          >
                            {post.mainImage?.asset?.url && (
                              <Image
                                src={sanityImageUrl(post.mainImage, {
                                  width: 900,
                                })}
                                alt={post.mainImage.alt || post.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 420px"
                                className="absolute inset-0 object-cover transition-transform duration-700 md:group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-0 left-0 p-5 sm:p-6">
                              {post.categories?.[0]?.title && (
                                <span
                                  className="text-xs font-black uppercase px-2 py-1 mb-2 inline-block border border-black"
                                  style={{
                                    backgroundColor: accent,
                                    color: "#000",
                                  }}
                                >
                                  {post.categories[0].title}
                                </span>
                              )}
                              <h4
                                className={`text-white text-xl sm:text-2xl font-black uppercase leading-tight transition-colors ${hoverText} line-clamp-3`}
                              >
                                {post.title}
                              </h4>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
