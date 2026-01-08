"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { sanityImageUrl } from "@/sanity/lib/image";
import { timeAgo } from "@/utils/date";

type TrendingPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  mainImage?: {
    asset?: { url?: string };
    alt?: string;
  };
  categories?: { _id?: string; title?: string; slug?: string }[];
};

const collageHoverBorders = [
  "hover:border-[#00f3ff]",
  "hover:border-[#ccff00]",
  "hover:border-[#f20d0d]",
  "hover:border-[#00f3ff]",
  "hover:border-[#f20d0d]",
  "hover:border-[#00f3ff]",
  "hover:border-[#ccff00]",
  "hover:border-[#f20d0d]",
  "hover:border-[#00f3ff]",
  "hover:border-[#ccff00]",
];

const collageHoverTitles = [
  "group-hover:text-[#00f3ff]",
  "group-hover:text-[#ccff00]",
  "group-hover:text-[#f20d0d]",
  "group-hover:text-[#00f3ff]",
  "group-hover:text-[#f20d0d]",
  "group-hover:text-[#00f3ff]",
  "group-hover:text-[#ccff00]",
  "group-hover:text-[#f20d0d]",
  "group-hover:text-[#00f3ff]",
  "group-hover:text-[#ccff00]",
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function TrendingRail({ posts }: { posts: TrendingPost[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ width: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const visiblePosts = useMemo(() => posts ?? [], [posts]);

  const updateThumb = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const { scrollLeft, scrollWidth, clientWidth } = scroller;
    if (scrollWidth <= 0) return;

    if (scrollWidth <= clientWidth) {
      setThumb({ width: 100, left: 0 });
      return;
    }

    const thumbPercent = (clientWidth / scrollWidth) * 100;
    const maxLeft = Math.max(0, 100 - thumbPercent);
    const progress =
      scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0;

    setThumb({
      width: thumbPercent,
      left: progress * maxLeft,
    });
  }, []);

  const scrollToPercent = useCallback((percent: number, smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 0) return;

    const nextLeft = maxScroll * clamp(percent, 0, 1);
    scroller.scrollTo({ left: nextLeft, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const { left, width } = trackRef.current.getBoundingClientRect();
      if (width === 0) return;

      const percent = clamp((event.clientX - left) / width, 0, 1);
      scrollToPercent(percent);
      setIsDragging(true);
    },
    [scrollToPercent]
  );

  useEffect(() => {
    const frame = requestAnimationFrame(updateThumb);
    const scroller = scrollerRef.current;
    if (!scroller) {
      return () => cancelAnimationFrame(frame);
    }

    const handleScroll = () => updateThumb();
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateThumb);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateThumb);
    };
  }, [updateThumb, visiblePosts.length]);

  useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      if (!trackRef.current) return;
      const { left, width } = trackRef.current.getBoundingClientRect();
      if (width === 0) return;
      const percent = clamp((event.clientX - left) / width, 0, 1);
      scrollToPercent(percent, false);
    };

    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, scrollToPercent]);

  return (
    <section className="mb-10">
      <div className="flex flex-col md:flex-row items-end gap-4 mb-16 px-4">
        <h2 className="text-6xl md:text-7xl flex-2/500 font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase italic tracking-tighter leading-[0.8]">
          Trending <br />
          <span className="text-[#f20d0d] text-4xl md:text-6xl not-italic ml-12 font-bold">
            Now
          </span>
        </h2>
        <div
          ref={trackRef}
          className="h-1 bg-[#1e1e1e] flex-grow mb-4 relative overflow-hidden rounded-full cursor-pointer"
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className="absolute inset-y-0 bg-[#ccff00] transition-[width,left] duration-200 ease-out"
            style={{
              width: `${thumb.width}%`,
              left: `${thumb.left}%`,
            }}
          />
        </div>
      </div>

      <div className="-mx-2 sm:-mx-4">
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto pb-4 lg:pb-6 px-2 sm:px-4 snap-x snap-mandatory hide-scrollbar"
        >
          {visiblePosts.map((post, idx) => {
            const transformClass = collageTransforms[idx] ?? "";
            const borderHover =
              collageHoverBorders[idx] ?? "hover:border-[#f20d0d]";
            const titleHover =
              collageHoverTitles[idx] ?? "group-hover:text-[#f20d0d]";

            return (
              <article
                key={post._id}
                className={`relative shrink-0 w-100 mt-12 snap-start ${transformClass}`}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="block group"
                  aria-label={`Read ${post.title}`}
                >
                  <div
                    className={`bg-[#121212] border-2 border-[#2a2a2a] p-1 transform transition-all duration-300 hover:-translate-y-2 hover:z-50 shadow-lg ${borderHover}`}
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
                          className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
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
                      <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                        <span>{timeAgo(post.publishedAt)}</span>
                        <ArrowUpRight className="h-4 w-4" />
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
