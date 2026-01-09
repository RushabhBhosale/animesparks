'use client';

import { useState } from "react";
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
  const [visibleCount, setVisibleCount] = useState(10);

  if (!posts.length) return null;

  const clampedVisibleCount = Math.min(visibleCount, posts.length);
  const visiblePosts = posts.slice(0, clampedVisibleCount);
  const [heroPost, ...restPosts] = visiblePosts;
  const featuredPosts = restPosts.slice(0, 3);
  const gridPosts = restPosts.slice(3);
  const hasMore = clampedVisibleCount < posts.length;

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + 10, posts.length));
  };

  return (
    <div className="pt-32 pb-20 relative w-full">
      {/* Background decorative text */}
      <div className="absolute top-20 -right-20 text-[20rem] font-black text-white/3 select-none -z-10 leading-none rotate-90 origin-top-right pointer-events-none">
        FIRE
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div className="relative mb-20">
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter leading-[0.75] mb-10">
            What's <br />
            <span className="text-outline-red ml-8 md:ml-16">Trending</span>
          </h1>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-4 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-1/3 justify-start md:justify-end z-20 pointer-events-auto">
            <button className="bg-anime-lime text-black font-black uppercase text-sm md:text-base px-6 py-3 transform -rotate-3 hover:rotate-0 hover:scale-110 transition-all border-2 border-white shadow-hard cursor-pointer">
              🔥 This Week
            </button>
            <button className="bg-anime-red text-white font-black uppercase text-sm md:text-base px-6 py-3 transform rotate-2 hover:rotate-0 hover:scale-110 transition-all border-2 border-black shadow-hard-white cursor-pointer">
              📈 Popular Now
            </button>
            <button className="bg-anime-cyan text-black font-black uppercase text-sm md:text-base px-6 py-3 transform -rotate-2 hover:rotate-0 hover:scale-110 transition-all border-2 border-white shadow-hard cursor-pointer">
              💬 Most Discussed
            </button>
            <button className="bg-black text-white font-black uppercase text-sm md:text-base px-6 py-3 transform rotate-3 hover:rotate-0 hover:scale-110 transition-all border-2 border-white shadow-hard-green cursor-pointer">
              👁️ Visuals
            </button>
          </div>
        </div>

        {/* HERO POST - Full width */}
        <article className="mb-20">
          <Link href={`/blog/${heroPost.slug}`} className="group block relative">
            <div className="relative">
              {/* badge sits OUTSIDE the clipped layer */}
              <div className="absolute -top-6 -left-6 bg-anime-red text-white font-black text-3xl px-6 py-3 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] z-30">
                01
              </div>

              {/* clipped layer */}
              <div className="relative h-[500px] md:h-[600px] overflow-hidden border-4 border-anime-lime bg-black transform -rotate-1 hover:rotate-0 transition-all shadow-[16px_16px_0px_0px_rgba(204,255,0,0.3)]">
                {heroPost.mainImage && (
                  <Image
                    src={sanityImageUrl(heroPost.mainImage, { width: 1600 })}
                    alt={heroPost.mainImage.alt || heroPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="bg-anime-cyan text-black text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-black">
                        {heroPost.categories?.[0]?.title ?? "Featured"}
                      </span>
                      <span className="text-gray-300 text-sm font-mono">
                        {formatDate(heroPost.publishedAt)}
                      </span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black uppercase leading-none text-white group-hover:text-anime-lime transition-colors mb-4">
                      {heroPost.title}
                    </h2>

                    {heroPost.excerpt && (
                      <p className="text-gray-300 text-base md:text-lg max-w-2xl">
                        {heroPost.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </article>

        {/* FEATURED 3 - Horizontal cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {featuredPosts.map((post, idx) => {
            const colors = [
              {
                bg: "bg-anime-red",
                badge: "bg-anime-lime",
                border: "border-anime-red",
              },
              {
                bg: "bg-anime-cyan",
                badge: "bg-anime-red",
                border: "border-anime-cyan",
              },
              { bg: "bg-white", badge: "bg-black", border: "border-white" },
            ];
            const color = colors[idx];
            const rotation =
              idx === 0 ? "rotate-0" : idx === 1 ? "-rotate-2" : "rotate-0";

            return (
              <article key={post._id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={clsx(
                    "group block relative transform transition-all hover:rotate-0 hover:-translate-y-2",
                    rotation
                  )}
                >
                  <div
                    className={clsx(
                      "border-3",
                      color.border,
                      "bg-black p-4 shadow-hard-white"
                    )}
                  >
                    {/* Number badge */}
                    <div
                      className={clsx(
                        "absolute -top-5 -left-5 text-white font-black text-xl px-4 py-2 border-2 border-black shadow-hard z-10",
                        color.badge
                      )}
                    >
                      0{idx + 2}
                    </div>

                    {/* Image */}
                    {post.mainImage && (
                      <div className="relative h-56 mb-4 overflow-hidden border-2 border-white/10">
                        <Image
                          src={sanityImageUrl(post.mainImage, { width: 800 })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 border border-white/20">
                          {post.categories?.[0]?.title ?? "Article"}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <h3 className="text-xl font-black uppercase text-white leading-tight mb-3 group-hover:text-anime-lime transition-colors">
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

        {/* GRID POSTS - Simple 2-column grid */}
        <div>
          <h3 className="text-3xl md:text-4xl font-black uppercase mb-10 flex items-center gap-4">
            <span className="text-white">More</span>
            <span className="text-outline-red">Heat</span>
            <span className="h-1 flex-grow bg-anime-lime"></span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {gridPosts.map((post, idx) => {
              const isEven = idx % 2 === 0;
              const rotation = isEven ? "-rotate-0" : "rotate-0";

              return (
                <article key={post._id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className={clsx(
                      "group block relative transform transition-all hover:rotate-0 hover:-translate-y-2",
                      rotation
                    )}
                  >
                    <div className="bg-anime-panel border-2 border-white/20 p-6 shadow-hard-white">
                      {/* Number badge */}
                      <div className="absolute -top-4 -left-4 bg-white text-black font-black text-lg px-4 py-2 border-2 border-black shadow-hard z-10">
                        {String(idx + 5).padStart(2, "0")}
                      </div>

                      {/* Image */}
                      {post.mainImage && (
                        <div className="relative h-48 mb-4 overflow-hidden border border-white/10">
                          <Image
                            src={sanityImageUrl(post.mainImage, {
                              width: 800,
                            })}
                            alt={post.mainImage.alt || post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-anime-red text-white text-[10px] font-black uppercase px-2 py-1">
                            {post.categories?.[0]?.title ?? "News"}
                          </span>
                          <span className="text-xs font-mono text-gray-500">
                            {formatDate(post.publishedAt)}
                          </span>
                        </div>

                        <h4 className="text-2xl font-black uppercase text-white leading-tight group-hover:text-anime-cyan transition-colors">
                          {post.title}
                        </h4>

                        {post.excerpt && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}

                        <div className="pt-2">
                          <span className="text-xs font-black uppercase text-white/60 group-hover:text-anime-lime transition-colors">
                            Continue Reading →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12">
              <button
                type="button"
                onClick={handleLoadMore}
                className="bg-anime-lime text-black font-black uppercase tracking-wide px-8 py-4 border-2 border-black shadow-hard hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(204,255,0,0.35)] transition-all"
              >
                Load 10 More Files
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
