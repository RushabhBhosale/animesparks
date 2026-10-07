import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { contentImageUrl } from "@/lib/content/image";
import { formatPostDate } from "@/utils/date";

export type InlineRelatedPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  mainImage?: { asset?: { r2Key?: string; url?: string; publicUrl?: string }; alt?: string };
};

interface InlineRelatedBlogProps {
  posts: InlineRelatedPost[];
  locale?: "en" | "es";
  heading?: string;
  kicker?: string;
  readLabel?: string;
}

export function InlineRelatedBlog({
  posts,
  locale = "en",
  heading = locale === "es" ? "Más artículos como este" : "More blogs like this",
  kicker = locale === "es" ? "Artículo relacionado" : "Related post",
  readLabel = locale === "es" ? "Leer artículo" : "Read article",
}: InlineRelatedBlogProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <aside
      className="my-10 border-2 border-[#2a2a2a] bg-[#0c0c0c] p-4 sm:p-5 relative transition-all duration-300 shadow-[6px_6px_0px_0px_#f20d0d] md:hover:border-[#ccff00] md:hover:shadow-[6px_6px_0px_0px_#ccff00]"
      aria-label={heading}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="size-2 bg-[#f20d0d] rounded-full inline-block animate-pulse" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white m-0">
            {heading}
          </h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00] bg-black px-2.5 py-0.5 border border-[#ccff00]/40 -rotate-1 shadow-[2px_2px_0px_0px_#ccff00]">
          {kicker}
        </span>
      </div>

      <div className="grid gap-3.5">
        {posts.map((post) => {
          const href = locale === "es" ? `/es/blog/${post.slug}` : `/blog/${post.slug}`;
          const imageUrl = post.mainImage ? contentImageUrl(post.mainImage, { width: 600, quality: 70 }) : undefined;

          return (
            <Link
              key={post._id}
              href={href}
              className="group block border border-[#222] bg-[#121212] p-3 sm:p-4 no-underline md:hover:border-[#ccff00] md:hover:bg-[#151515] transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {imageUrl && (
                  <div className="relative aspect-video sm:aspect-[16/10] w-full sm:w-44 md:w-52 shrink-0 overflow-hidden bg-[#080808] border border-white/10">
                    <Image
                      src={imageUrl}
                      alt={post.mainImage?.alt || post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 220px"
                      className="object-cover grayscale md:group-hover:grayscale-0 transition-all duration-500 md:group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="m-0 text-base sm:text-lg font-black uppercase leading-snug text-white md:group-hover:text-[#ccff00] transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  {post.excerpt && (
                    <p className="mt-2 mb-0 text-xs sm:text-sm text-gray-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {post.publishedAt ? (
                      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1 text-[#f20d0d] md:group-hover:text-[#ccff00] transition-colors font-black">
                      {readLabel}
                      <ArrowUpRight className="size-3.5 transition-transform md:group-hover:translate-x-0.5 md:group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
