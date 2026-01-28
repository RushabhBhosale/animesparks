import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdSlot } from "@/components/ads/ad-slot";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { formatDate } from "@/utils/date";

import type { BlogPost } from "./types";

type BlogListContentProps = {
  posts: BlogPost[];
  initialVisible?: number;
};

export function BlogListContent({
  posts,
  initialVisible = 10,
}: BlogListContentProps) {
  if (!posts.length) return null;

  const capped = Math.min(Math.max(initialVisible, 0), posts.length);
  const primaryPosts = posts.slice(0, Math.max(capped, 10));
  const extraPosts = posts.slice(primaryPosts.length);
  const INFEED_AD_SLOTS = ["4781968940", "4833939831"];

  return (
    <div className="space-y-10">
      <div className="space-y-8">
        {primaryPosts.flatMap((post, index) => {
          const isLarge = (index + 1) % 4 === 0;
          const displayNumber = String(index + 2).padStart(2, "0");
          const blocks: ReactNode[] = [];

          if (isLarge) {
            blocks.push(
              <Link
                prefetch={false}
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group relative block ob-panel border-2 border-white/15 bg-anime-panel p-4 md:p-5 shadow-hard-white md:hover:-translate-y-1 transition-transform"
              >
                <div className="absolute -top-4 -left-4 bg-anime-red text-white font-black text-sm px-3 py-1 border-2 border-black shadow-hard z-20 uppercase tracking-[0.14em]">
                  Blog {displayNumber}
                </div>

                {post.mainImage?.asset?.url && (
                  <div className="relative h-64 w-full overflow-hidden bg-black border border-white/10">
                    <Image
                      src={sanityHeroImageUrl(post.mainImage)}
                      alt={post.mainImage.alt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="object-cover transition-transform duration-500 md:group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 ob-chip px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                      {post.categories?.[0]?.title ?? "Insight"}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight tracking-tight text-white md:group-hover:text-anime-lime transition-colors">
                    {post.title}
                  </h3>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
                    <span className="text-[10px] font-mono uppercase text-anime-muted-subtle">
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/80 md:group-hover:text-anime-cyan transition-colors">
                      Open File →
                    </span>
                  </div>
                </div>
              </Link>,
            );
          } else {
            blocks.push(
              <Link
                prefetch={false}
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group relative flex gap-4 ob-panel border-2 border-white/10 bg-anime-panel p-4 md:p-5 shadow-hard-white md:hover:-translate-y-1 transition-transform"
              >
                <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />

                <div className="absolute -top-4 -left-4 bg-anime-cyan text-black font-black text-[11px] px-3 py-1 border-2 border-black shadow-hard-green z-20 uppercase tracking-[0.14em]">
                  {post.categories?.[0]?.title ?? "Insight"}
                </div>

                {post.mainImage?.asset?.url && (
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden bg-black border border-white/10 sm:h-28 sm:w-40">
                    <Image
                      src={sanityImageUrl(post.mainImage, { width: 900 })}
                      alt={post.mainImage.alt || post.title}
                      fill
                      sizes="(max-width: 768px) 92vw, 420px"
                      className="object-cover transition-transform duration-300 md:group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div className="flex flex-col justify-center gap-2 flex-1">
                  <h3 className="text-lg sm:text-xl font-black uppercase leading-tight text-white md:group-hover:text-anime-lime transition-colors">
                    {post.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-anime-muted-subtle">
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70 md:group-hover:text-anime-red transition-colors">
                      Read →
                    </span>
                  </div>
                </div>
              </Link>,
            );
          }

          if ((index + 1) % 6 === 0) {
            const adIndex = Math.floor((index + 1) / 6) - 1;
            const slot = INFEED_AD_SLOTS[adIndex % INFEED_AD_SLOTS.length];

            blocks.push(
              <div
                key={`list-ad-${index}`}
                className="ob-panel border-2 border-white/10 bg-anime-panel p-3 md:p-4 shadow-hard-white"
              >
                <div className="border border-white/10 bg-black/70 p-2 sm:p-3">
                  <AdSlot
                    variant="inline"
                    slot={slot}
                    insClassName="min-h-[200px] md:min-h-[220px]"
                    className="my-0 w-full"
                  />
                </div>
              </div>,
            );
          }

          return blocks;
        })}
      </div>

      {extraPosts.length > 0 && (
        <section className="space-y-6 border-t border-white/10 pt-8">
          <div className="space-y-6">
            {extraPosts.flatMap((post: BlogPost, index: number) => {
              const blocks: ReactNode[] = [];
              const overallIndex = primaryPosts.length + index + 1;

              blocks.push(
                <Link
                  prefetch={false}
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group relative flex gap-4 ob-panel border-2 border-white/10 bg-anime-panel p-4 md:p-5 shadow-hard-white md:hover:-translate-y-1 transition-transform"
                >
                  <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />

                  <div className="absolute -top-4 -left-4 bg-anime-cyan text-black font-black text-[11px] px-3 py-1 border-2 border-black shadow-hard-green z-20 uppercase tracking-[0.14em]">
                    {post.categories?.[0]?.title ?? "Insight"}
                  </div>

                  {post.mainImage?.asset?.url && (
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden bg-black border border-white/10 sm:h-28 sm:w-40">
                      <Image
                        src={sanityImageUrl(post.mainImage, {
                          width: 900,
                        })}
                        alt={post.mainImage.alt || post.title}
                        fill
                        sizes="(max-width: 768px) 92vw, 420px"
                        className="object-cover transition-transform duration-300 md:group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}

                  <div className="flex flex-col justify-center gap-2 flex-1">
                    <h3 className="text-lg sm:text-xl font-black uppercase leading-tight text-white md:group-hover:text-anime-lime transition-colors">
                      {post.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-anime-muted-subtle">
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70 md:group-hover:text-anime-red transition-colors">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>,
              );

              if (overallIndex % 6 === 0) {
                blocks.push(
                  <div
                    key={`extra-list-ad-${overallIndex}`}
                    className="ob-panel border-2 border-white/10 bg-anime-panel p-3 md:p-4 shadow-hard-white"
                  >
                    <div className="border border-white/10 bg-black/70 p-2 sm:p-3">
                      <AdSlot
                        variant="inline"
                        slot="7844480086"
                        insClassName="min-h-[200px] md:min-h-[220px]"
                        className="my-0 w-full"
                      />
                    </div>
                  </div>,
                );
              }

              return blocks;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
