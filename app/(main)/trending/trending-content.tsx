"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

import { sanityImageUrl } from "@/sanity/lib/image";
import { formatDate } from "@/utils/date";

import type { BlogPost } from "./types";

type TrendingContentProps = {
  posts: BlogPost[];
};

export function TrendingContent({ posts }: TrendingContentProps) {
  // start smaller on mobile, keep 10 on md+
  const [visibleCount, setVisibleCount] = useState(10);

  if (!posts.length) return null;

  const clampedVisibleCount = Math.min(visibleCount, posts.length);
  const visiblePosts = posts.slice(0, clampedVisibleCount);

  const heroPost = visiblePosts[0];
  const restPosts = visiblePosts.slice(1);
  const featuredPosts = restPosts.slice(0, 3);
  const gridPosts = restPosts.slice(3);

  const hasMore = clampedVisibleCount < posts.length;

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + 10, posts.length));
  };

  const headerTitle = useMemo(() => {
    return {
      main: "What's",
      accent: "Trending",
    };
  }, []);

  return (
    <section className="relative w-full pt-10 md:pt-28 pb-16 md:pb-20">
      {/* Background decorative text (lighter + safer on mobile) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-12 -right-24 md:-right-20 text-[7rem] sm:text-[10rem] md:text-[20rem] font-black text-white/3 -z-10 leading-none rotate-90 origin-top-right select-none"
      >
        FIRE
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Header */}
        <header className="relative mb-12 md:mb-20">
          <h1 className="text-[2.75rem] leading-[0.9] sm:text-6xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter mb-6 md:mb-10">
            {headerTitle.main} <br />
            <span className="text-outline-red ml-3 sm:ml-6 md:ml-16">
              {headerTitle.accent}
            </span>
          </h1>

          {/* Filters: visible on mobile as horizontal scroll, stays on right on md+ */}
          <div className="hidden lg:block md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-[28%] z-20 pointer-events-auto">
            <div className="flex md:flex-wrap gap-3 md:gap-4 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
              <button className="shrink-0 bg-anime-lime text-black font-black uppercase text-xs sm:text-sm md:text-base px-4 sm:px-6 py-3 transform md:-rotate-3 md:hover:rotate-0 md:hover:scale-[1.03] transition-all border-2 border-white shadow-hard cursor-pointer">
                🔥 This Week
              </button>
              <button className="shrink-0 bg-anime-red text-white font-black uppercase text-xs sm:text-sm md:text-base px-4 sm:px-6 py-3 transform md:rotate-2 md:hover:rotate-0 md:hover:scale-[1.03] transition-all border-2 border-black shadow-hard-white cursor-pointer">
                📈 Popular Now
              </button>
              <button className="shrink-0 bg-anime-cyan text-black font-black uppercase text-xs sm:text-sm md:text-base px-4 sm:px-6 py-3 transform md:-rotate-2 md:hover:rotate-0 md:hover:scale-[1.03] transition-all border-2 border-white shadow-hard cursor-pointer">
                💬 Most Discussed
              </button>
              <button className="shrink-0 bg-black text-white font-black uppercase text-xs sm:text-sm md:text-base px-4 sm:px-6 py-3 transform md:rotate-3 md:hover:rotate-0 md:hover:scale-[1.03] transition-all border-2 border-white shadow-hard-green cursor-pointer">
                👁️ Visuals
              </button>
            </div>
          </div>
        </header>

        {/* HERO POST */}
        {heroPost && (
          <article className="mb-12 md:mb-20">
            <Link
              href={`/blog/${heroPost.slug}`}
              className="group block relative"
            >
              <div className="relative">
                {/* badge sits OUTSIDE the clipped layer */}
                <div className="absolute -top-4 -left-2 sm:-top-6 sm:-left-6 bg-anime-red text-white font-black text-xl sm:text-2xl md:text-3xl px-4 sm:px-6 py-2 sm:py-3 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] z-30">
                  01
                </div>

                <div className="relative h-[340px] sm:h-[420px] md:h-[600px] overflow-hidden border-4 border-anime-lime bg-black transform md:-rotate-1 md:hover:rotate-0 transition-all shadow-[10px_10px_0px_0px_rgba(204,255,0,0.22)] md:shadow-[16px_16px_0px_0px_rgba(204,255,0,0.3)]">
                  {heroPost.mainImage ? (
                    <Image
                      src={sanityImageUrl(heroPost.mainImage, { width: 1600 })}
                      alt={heroPost.mainImage.alt || heroPost.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 1400px"
                      className="object-cover transition-transform duration-700 md:group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(242,13,13,0.25),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,243,255,0.18),transparent_55%)]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12">
                    <div className="max-w-4xl">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <span className="bg-anime-cyan text-black text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-black">
                          {heroPost.categories?.[0]?.title ?? "Featured"}
                        </span>
                        <span className="text-gray-300 text-xs sm:text-sm font-mono">
                          {formatDate(heroPost.publishedAt)}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl md:text-6xl font-black uppercase leading-[0.95] md:leading-none text-white md:group-hover:text-anime-lime transition-colors mb-3 sm:mb-4">
                        {heroPost.title}
                      </h2>

                      {heroPost.excerpt ? (
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl line-clamp-3 md:line-clamp-none">
                          {heroPost.excerpt}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        )}

        {/* FEATURED 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
          {featuredPosts.map((post, idx) => {
            const colors = [
              {
                badge: "bg-anime-lime text-black",
                border: "border-anime-red",
              },
              {
                badge: "bg-anime-red text-white",
                border: "border-anime-cyan",
              },
              {
                badge: "bg-black text-white",
                border: "border-white",
              },
            ];
            const color = colors[idx] || colors[0];

            // rotations only on md+ to avoid wonky mobile clipping
            const rotation =
              idx === 0
                ? "md:rotate-0"
                : idx === 1
                  ? "md:-rotate-2"
                  : "md:rotate-0";

            return (
              <article key={post._id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={clsx(
                    "group block relative transform transition-all md:hover:rotate-0 md:hover:-translate-y-2",
                    rotation
                  )}
                >
                  <div
                    className={clsx(
                      "relative bg-black p-4 border-2",
                      color.border,
                      "shadow-hard-white"
                    )}
                  >
                    <div
                      className={clsx(
                        "absolute -top-4 -left-4 font-black text-base sm:text-lg px-3 py-2 border-2 border-black shadow-hard z-10",
                        color.badge
                      )}
                    >
                      0{idx + 2}
                    </div>

                    {post.mainImage ? (
                      <div className="relative h-48 sm:h-56 mb-4 overflow-hidden border-2 border-white/10">
                        <Image
                          src={sanityImageUrl(post.mainImage, { width: 900 })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 520px"
                          className="object-cover transition-transform duration-500 md:group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 border border-white/20">
                          {post.categories?.[0]?.title ?? "Article"}
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 sm:h-56 mb-4 bg-[radial-gradient(circle_at_30%_20%,rgba(204,255,0,0.18),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(242,13,13,0.18),transparent_55%)] border-2 border-white/10" />
                    )}

                    <h3 className="text-lg sm:text-xl font-black uppercase text-white leading-tight mb-3 md:group-hover:text-anime-lime transition-colors line-clamp-3">
                      {post.title}
                    </h3>

                    <div className="flex items-center justify-between pt-3 border-t border-white/20">
                      <span className="text-xs font-mono text-gray-500">
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="text-xs font-black uppercase text-anime-lime">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* GRID POSTS */}
        <section>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-6 md:mb-10 flex items-center gap-3 sm:gap-4">
            <span className="text-white">More</span>
            <span className="text-outline-red">Heat</span>
            <span className="h-1 flex-grow bg-anime-lime" />
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {gridPosts.map((post, idx) => (
              <article key={post._id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block relative transition-all md:hover:-translate-y-2"
                >
                  <div className="relative bg-anime-panel border-2 border-white/20 p-4 sm:p-6 shadow-hard-white">
                    <div className="absolute -top-4 -left-4 bg-white text-black font-black text-base sm:text-lg px-3 py-2 border-2 border-black shadow-hard z-10">
                      {String(idx + 5).padStart(2, "0")}
                    </div>

                    {post.mainImage ? (
                      <div className="relative h-44 sm:h-48 mb-4 overflow-hidden border border-white/10">
                        <Image
                          src={sanityImageUrl(post.mainImage, { width: 900 })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 650px"
                          className="object-cover transition-transform duration-500 md:group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-anime-red text-white text-[10px] font-black uppercase px-2 py-1">
                          {post.categories?.[0]?.title ?? "News"}
                        </span>
                        <span className="text-xs font-mono text-gray-500">
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>

                      <h4 className="text-xl sm:text-2xl font-black uppercase text-white leading-tight md:group-hover:text-anime-cyan transition-colors line-clamp-3">
                        {post.title}
                      </h4>

                      {post.excerpt ? (
                        <p className="text-sm text-gray-400 line-clamp-3">
                          {post.excerpt}
                        </p>
                      ) : null}

                      <div className="pt-1">
                        <span className="text-xs font-black uppercase text-white/60 md:group-hover:text-anime-lime transition-colors">
                          Continue Reading →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center mt-10 md:mt-12">
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full sm:w-auto bg-anime-lime text-black font-black uppercase tracking-wide px-6 sm:px-8 py-4 border-2 border-black shadow-hard md:hover:-translate-y-1 md:hover:shadow-[8px_8px_0px_0px_rgba(204,255,0,0.35)] transition-all"
              >
                Load 10 More Files
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
