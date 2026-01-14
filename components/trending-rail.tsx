import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { sanityImageUrl } from "@/sanity/lib/image";
import { timeAgo } from "@/utils/date";

type TrendingPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  viewCount?: number;
  mainImage?: {
    asset?: { url?: string };
    alt?: string;
  };
  categories?: { _id?: string; title?: string; slug?: string }[];
};

const collageHoverBorders = [
  "md:hover:border-[#00f3ff]",
  "md:hover:border-[#ccff00]",
  "md:hover:border-[#f20d0d]",
  "md:hover:border-[#00f3ff]",
  "md:hover:border-[#f20d0d]",
  "md:hover:border-[#00f3ff]",
  "md:hover:border-[#ccff00]",
  "md:hover:border-[#f20d0d]",
  "md:hover:border-[#00f3ff]",
  "md:hover:border-[#ccff00]",
];

const collageHoverTitles = [
  "md:group-hover:text-[#00f3ff]",
  "md:group-hover:text-[#ccff00]",
  "md:group-hover:text-[#f20d0d]",
  "md:group-hover:text-[#00f3ff]",
  "md:group-hover:text-[#f20d0d]",
  "md:group-hover:text-[#00f3ff]",
  "md:group-hover:text-[#ccff00]",
  "md:group-hover:text-[#f20d0d]",
  "md:group-hover:text-[#00f3ff]",
  "md:group-hover:text-[#ccff00]",
];

const collageTransforms = [
  "lg:-rotate-1 lg:-translate-y-2",
  "lg:rotate-2 lg:-translate-y-3",
  "lg:-rotate-2",
  "lg:rotate-1 lg:-translate-y-1",
  "lg:-rotate-1 lg:-translate-y-2",
  "lg:rotate-2 lg:-translate-y-3",
  "lg:-rotate-2",
  "lg:rotate-1 lg:-translate-y-1",
  "lg:-rotate-1 lg:-translate-y-2",
  "lg:rotate-2 lg:-translate-y-3",
];

export function TrendingRail({ posts }: { posts: TrendingPost[] }) {
  const visiblePosts = posts ?? [];

  return (
    <section className="mb-10">
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:mb-16 mb-6 px-4">
        <h2 className="text-6xl md:text-7xl flex-2/500 font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase italic tracking-tighter leading-[0.8]">
          Trending <br />
          <span className="text-[#f20d0d] text-4xl md:text-6xl not-italic ml-12 font-bold">
            Now
          </span>
        </h2>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gray-400">
          <span className="inline-block h-1 w-8 bg-[#ccff00]" />
          Swipe or scroll to explore
        </div>
      </div>

      <div className="-mx-2 sm:-mx-4">
        <div className="flex gap-6 overflow-x-auto pb-4 lg:pb-6 px-2 sm:px-4 snap-x snap-mandatory hide-scrollbar">
          {visiblePosts.map((post, idx) => {
            const transformClass = collageTransforms[idx] ?? "";
            const borderHover =
              collageHoverBorders[idx] ?? "md:hover:border-[#f20d0d]";
            const titleHover =
              collageHoverTitles[idx] ?? "md:group-hover:text-[#f20d0d]";

            return (
              <article
                key={post._id}
                className={`relative shrink-0 w-100 mt-12 snap-start ${transformClass}`}
              >
                <Link
                  prefetch={false}
                  href={`/blog/${post.slug}`}
                  className="block group"
                  aria-label={`Read ${post.title}`}
                >
                  <div
                    className={`bg-[#121212] border-2 border-[#2a2a2a] p-1 transform transition-all duration-300 md:hover:-translate-y-2 md:hover:z-50 shadow-lg ${borderHover}`}
                  >
                    <div className="relative h-52 overflow-hidden bg-black">
                      {post.mainImage?.asset?.url && (
                        <Image
                          src={sanityImageUrl(post.mainImage, {
                            width: 900,
                          })}
                          alt={post.mainImage.alt || post.title}
                          fill
                          sizes="(max-width: 768px) 90vw, 420px"
                          className="object-cover transition-transform duration-500 md:group-hover:scale-110 opacity-80 md:group-hover:opacity-100"
                        />
                      )}
                      {post.categories?.[0]?.title && (
                        <div className="absolute top-2 left-2 bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 uppercase border border-white/20">
                          {post.categories[0].title}
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-[#151515]">
                      <h3
                        className={`text-xl font-bold uppercase leading-tight mb-2 transition-colors ${titleHover}`}
                      >
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] uppercase text-gray-500 tracking-[0.16em]">
                        <span>{timeAgo(post.publishedAt)}</span>
                        <span className="inline-flex items-center gap-2 text-white md:group-hover:text-[#ccff00] transition-colors">
                          {post.viewCount !== undefined ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#0d0d0d] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-200 border border-[#1f1f1f]">
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M2.1 12S5.4 5 12 5s9.9 7 9.9 7-3.3 7-9.9 7S2.1 12 2.1 12Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              {post.viewCount.toLocaleString()}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1">
                            Read
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
