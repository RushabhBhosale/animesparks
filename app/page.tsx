import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Spline_Sans } from "next/font/google";

import { TrendingRail } from "@/components/trending-rail";
import { latestBlogsQuery } from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { formatDate, timeAgo } from "@/utils/date";
import { defaultOgImage, siteName } from "@/utils/seo";
import { bungeeOutline } from "@/lib/font";
import Header from "@/components/header";
import Footer from "@/components/footer";

const spline = Spline_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AnimeSparks Anime Blog Home",
  description:
    "Deep dives, reviews, and trending anime stories from AnimeSparks. Explore the latest editorials, character studies, and shonen breakdowns.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AnimeSparks Anime Blog Home",
    description:
      "Deep dives, reviews, and trending anime stories from AnimeSparks. Explore the latest editorials, character studies, and shonen breakdowns.",
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
  mainImage?: {
    asset?: { url?: string };
    alt?: string;
  };
  categories?: { _id: string; title: string; slug: string }[];
  author?: {
    name?: string;
    image?: {
      asset?: { url?: string };
      alt?: string;
    };
  };
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
  "group-hover:text-[#f20d0d]",
  "group-hover:text-[#00f3ff]",
  "group-hover:text-[#ccff00]",
];

export default async function Home() {
  const latest = await client.fetch<BlogCard[]>(latestBlogsQuery);

  const latestPosts = latest ?? [];
  const trendingSource = latestPosts.slice(0, 10);
  const featured = trendingSource[0] ?? null;
  const trendingCollage = trendingSource;
  const marqueeTitles =
    trendingSource.length > 0
      ? trendingSource.map((post) => post.title).filter(Boolean)
      : (latest?.map((post) => post.title).filter(Boolean) ?? []);
  const mainUpdates = latestPosts.slice(0, 3);
  const moreUpdates = latestPosts.slice(3, 6);
  const editorsPicks = latestPosts.slice(1, 4);
  const mustReads = trendingSource.slice(0, 5);
  const callout = trendingCollage[3] ?? trendingSource[3];

  return (
    <>
      <Header />
      <main
        className={`${spline.className} bg-[#050505] text-[#f0f0f0] overflow-hidden`}
      >
        <div className="relative min-h-screen">
          {/* Hero */}
          <header className="relative w-full pt-32 pb-20 px-4 md:px-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-2/3 h-full bg-[#f20d0d0d] -skew-x-12 z-0 pointer-events-none" />
            <div className="absolute top-16 left-4 md:left-10 text-[12rem] md:text-[16rem] lg:text-[20rem] font-black text-white/5 select-none z-0 leading-none whitespace-nowrap">
              ANIME
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6 relative">
                <div className="absolute -left-12 -top-12 size-24 border-4 border-dashed border-[#2f2f2f] rounded-full animate-[spin_10s_linear_infinite] opacity-40 hidden lg:block" />

                {featured?.categories?.[0]?.title && (
                  <div className="inline-flex self-start bg-black border border-[#f20d0d] px-3 py-1 -rotate-2 shadow-[8px_8px_0px_0px_rgba(242,13,13,1)]">
                    <span className="text-[#f20d0d] font-black uppercase text-xs tracking-[0.2em]">
                      {featured.categories[0].title}
                    </span>
                  </div>
                )}

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.9] tracking-tighter uppercase mix-blend-difference">
                  <span className="block">
                    {(featured?.title || "Featured Story")
                      .split(/\s+/)
                      .map((word, i) => {
                        const outline = (word.length + i) % 3 === 0; // random-ish but stable

                        return (
                          <span
                            key={i}
                            className={
                              outline
                                ? `${bungeeOutline.className} font-bungee-outline`
                                : ""
                            }
                          >
                            {word}
                            {i <
                            (featured?.title || "Featured Story").split(/\s+/)
                              .length -
                              1
                              ? " "
                              : ""}
                          </span>
                        );
                      })}
                  </span>
                </h1>

                {featured?.excerpt && (
                  <p className="text-lg md:text-xl text-gray-300 font-medium max-w-xl border-l-4 border-[#ccff00] pl-6 py-2">
                    {getExcerpt(featured.excerpt, 190)}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-4">
                  {featured?.slug && (
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="bg-white text-black font-black uppercase tracking-wider px-8 py-4 text-sm hover:bg-[#ccff00] transition-all shadow-[8px_8px_0px_0px_rgba(242,13,13,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                      Read Article
                    </Link>
                  )}

                  {featured?.categories?.[0]?.slug && (
                    <Link
                      href={`/categories/${featured.categories[0].slug}`}
                      className="flex items-center gap-2 px-4 py-3 border border-[#2f2f2f] bg-black/60 backdrop-blur-sm rounded-full"
                    >
                      <span className="text-xs font-bold uppercase text-gray-300">
                        {featured.categories[0].title}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[#ccff00]" />
                    </Link>
                  )}
                </div>

                {featured?.author?.name && (
                  <div className="flex items-center gap-2 px-4 py-3 border border-[#2f2f2f] bg-black/60 backdrop-blur-sm rounded-full w-fit">
                    {featured.author.image?.asset?.url && (
                      <div className="relative size-10 overflow-hidden rounded-full border border-white/80">
                        <Image
                          src={sanityImageUrl(featured.author.image, {
                            width: 100,
                            height: 100,
                          })}
                          alt={
                            featured.author.image.alt || featured.author.name
                          }
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs font-bold uppercase text-gray-300">
                      By {featured.author.name}
                    </span>
                  </div>
                )}
              </div>

              {featured?.mainImage?.asset?.url && (
                <div
                  className="lg:col-span-5 relative mt-10 lg:mt-0 group"
                  style={{ perspective: "1200px" }}
                >
                  <div className="relative z-20 bg-black p-2 transform transition-transform duration-500 group-hover:rotate-2 group-hover:scale-105 border-2 border-white/10">
                    <div className="relative aspect-[4/5] md:aspect-square w-full overflow-hidden bg-[#0c0c0c] grayscale group-hover:grayscale-0 transition-all duration-500">
                      <Image
                        src={sanityHeroImageUrl(featured.mainImage)}
                        alt={featured.mainImage.alt || featured.title}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 620px"
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-6 -right-6 bg-[#ccff00] text-black font-black text-4xl px-4 py-2 transform -rotate-6 shadow-[6px_6px_0px_0px_white] z-30">
                      #01
                    </div>
                    {featured.categories?.[0]?.title && (
                      <div className="absolute top-4 -left-8 bg-[#00f3ff] text-black font-bold text-xs px-3 py-1 transform -rotate-90 origin-bottom-right uppercase tracking-widest">
                        {featured.categories[0].title}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 left-4 w-full h-full border-4 border-[#f20d0d] z-10 -translate-x-4 translate-y-4" />
                </div>
              )}
            </div>
          </header>

          {/* Marquee */}
          {marqueeTitles.length > 0 && (
            <div className="bg-[#f20d0d] overflow-hidden py-3 transform -rotate-1 origin-left w-[105%] -ml-2 border-y-4 border-black z-20 relative">
              <div className="whitespace-nowrap flex gap-12 marquee-track">
                {marqueeTitles.concat(marqueeTitles).map((title, idx) => (
                  <span
                    key={`${title}-${idx}`}
                    className="text-black font-black uppercase text-xl italic tracking-widest"
                  >
                    {"///"} {title} {"///"}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="relative w-full overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-4 py-20">
              {/* Trending */}
              {trendingCollage.length > 0 && (
                <>
                  <TrendingRail posts={trendingCollage} />
                </>
              )}

              <div className="my-24 border-t border-[#1f1f1f] relative">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-4 text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">
                  Scroll Down for more
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                  <h3 className="text-5xl font-black text-white uppercase italic mb-8 pr-1 relative inline-block">
                    Latest <span className="font-bungee-outline">Updates</span>
                    <span className="absolute -right-4 -top-4 text-[#ccff00] text-6xl select-none">
                      *
                    </span>
                  </h3>

                  {mainUpdates.map((post, idx) => {
                    const badgeColors = ["#f20d0d", "#00f3ff", "#ccff00"];
                    const alignReverse = idx === 1;

                    return (
                      <article
                        key={post._id}
                        className={`group relative pl-8 border-l-2 border-[#1f1f1f] transition-colors ${
                          alignReverse ? "md:text-right" : ""
                        } hover:border-[#f20d0d]`}
                      >
                        <div className="absolute -left-[9px] top-0 size-4 bg-[#050505] border-2 border-[#3b3b3b] group-hover:border-[#f20d0d] group-hover:bg-[#f20d0d] transition-colors rounded-full" />
                        <div
                          className={`grid md:grid-cols-2 gap-6 ${
                            alignReverse ? "md:text-right" : ""
                          }`}
                        >
                          <div
                            className={`relative overflow-hidden border border-[#2a2a2a] group-hover:border-[#f20d0d]/60 transition-colors ${
                              alignReverse ? "order-1 md:order-2" : ""
                            }`}
                          >
                            {post.mainImage?.asset?.url && (
                              <div className="relative aspect-video">
                                <Image
                                  src={sanityImageUrl(post.mainImage, {
                                    width: 1200,
                                  })}
                                  alt={post.mainImage.alt || post.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 560px"
                                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex flex-col justify-center ${
                              alignReverse ? "order-2 md:order-1" : ""
                            }`}
                          >
                            <div
                              className={`flex gap-2 mb-3 ${
                                alignReverse
                                  ? "justify-start md:justify-end"
                                  : "justify-start"
                              }`}
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
                            <h4
                              className={`text-2xl md:text-3xl font-black text-white uppercase leading-none mb-3 group-hover:text-[${badgeColors[idx]}] transition-colors`}
                            >
                              {post.title}
                            </h4>
                            {post.excerpt && (
                              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                {getExcerpt(post.excerpt, 160)}
                              </p>
                            )}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="inline-flex items-center gap-2 text-[#f20d0d] font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
                            >
                              Read More <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {moreUpdates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {moreUpdates.map((post) => (
                        <Link href={`/blog/${post.slug}`} key={post._id}>
                          <article className="group relative pl-6 border-l-2 border-[#1f1f1f] hover:border-[#00f3ff] transition-colors">
                            <div className="absolute -left-[9px] top-0 size-4 bg-[#050505] border-2 border-[#3b3b3b] group-hover:border-[#00f3ff] group-hover:bg-[#00f3ff] transition-colors rounded-full" />
                            <div className="flex gap-4">
                              {post.mainImage?.asset?.url && (
                                <div className="relative h-24 w-32 overflow-hidden border border-[#2a2a2a]">
                                  <Image
                                    src={sanityImageUrl(post.mainImage, {
                                      width: 600,
                                    })}
                                    alt={post.mainImage.alt || post.title}
                                    fill
                                    sizes="160px"
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                  />
                                </div>
                              )}
                              <div className="flex flex-col justify-center">
                                <h5 className="text-lg font-black uppercase leading-tight group-hover:text-[#00f3ff] transition-colors">
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
                    className="block text-center w-full bg-transparent border-2 border-[#2a2a2a] text-white font-black uppercase py-4 hover:bg-white hover:text-black transition-colors tracking-widest text-lg group"
                  >
                    Load More Chaos{" "}
                    <span className="inline-block transition-transform group-hover:rotate-180 ml-2">
                      +
                    </span>
                  </Link>
                </div>

                <aside className="lg:col-span-4 space-y-12 relative">
                  <div className="sticky top-24 space-y-8">
                    <div className="bg-[#f20d0d] p-1 shadow-[8px_8px_0px_0px_rgba(242,13,13,0.7)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group">
                      <div className="bg-black p-6 h-64 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_#2d2d2d_1px,_transparent_1px)] bg-[size:14px_14px]" />
                        <h4 className="text-2xl font-black text-white uppercase italic z-10">
                          Anime
                          <br />
                          Merch
                        </h4>
                        <p className="text-gray-400 text-xs mb-4 z-10">
                          Limited Edition Drops
                        </p>
                        <button className="bg-white text-black text-xs font-bold uppercase px-4 py-2 z-10 group-hover:bg-[#f20d0d] group-hover:text-white transition-colors">
                          Shop Now
                        </button>
                      </div>
                    </div>

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
                              key={post._id}
                              href={`/blog/${post.slug}`}
                              className="flex gap-4 items-center group"
                            >
                              <span className="text-4xl font-black text-[#2c2c2c] group-hover:text-[#f20d0d] transition-colors italic">
                                {idx + 1}
                              </span>
                              <p className="text-sm font-bold text-white leading-tight group-hover:translate-x-2 transition-transform">
                                {post.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-2 border-white p-6 transform -rotate-2 bg-black">
                      <h4 className="text-3xl font-black uppercase text-white mb-2 text-center">
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
                      <button className="w-full bg-[#f20d0d] text-white font-black uppercase py-3 hover:bg-red-700 transition-colors">
                        Subscribe
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {/* Editor Picks */}
            {editorsPicks.length > 0 && (
              <section className="bg-[#f0f0f0] text-black py-20 transform -skew-y-2 origin-top-left border-y-8 border-black">
                <div className="max-w-7xl mx-auto px-6 transform skew-y-2">
                  <div className="flex justify-between items-end mb-12">
                    <h3 className="text-6xl font-black uppercase tracking-tighter">
                      Editors <br />
                      <span className="text-[#f20d0d]">Picks</span>
                    </h3>
                    <ArrowDown className="h-14 w-14 animate-bounce" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {editorsPicks.slice(0, 3).map((post, idx) => {
                      const accent =
                        ["#f20d0d", "#00f3ff", "#ccff00"][idx] ?? "#f20d0d";
                      const shadowClass =
                        editorShadows[idx] ??
                        "shadow-[8px_8px_0px_0px_#f20d0d]";
                      const hoverText =
                        editorTextHover[idx] ?? "group-hover:text-[#f20d0d]";

                      return (
                        <Link
                          key={post._id}
                          href={`/blog/${post.slug}`}
                          className={`group cursor-pointer ${
                            idx === 1 ? "md:-mt-12" : ""
                          }`}
                        >
                          <div
                            className={`overflow-hidden border-4 border-black ${shadowClass} hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all bg-black h-80 relative`}
                          >
                            {post.mainImage?.asset?.url && (
                              <Image
                                src={sanityImageUrl(post.mainImage, {
                                  width: 900,
                                })}
                                alt={post.mainImage.alt || post.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 420px"
                                className="absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-0 left-0 p-6">
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
                                className={`text-white text-2xl font-black uppercase leading-none transition-colors ${hoverText}`}
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
