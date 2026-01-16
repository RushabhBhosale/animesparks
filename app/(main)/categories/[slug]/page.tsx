import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { client } from "@/sanity/lib/client";
import { sanityImageUrl } from "@/sanity/lib/image";
import {
  blogsByCategoryQuery,
  categoryBySlugQuery,
} from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import { defaultOgImage, siteName } from "@/utils/seo";
import {
  ChevronRight,
  Terminal,
  ArrowRight,
  Star,
  Bookmark,
  Quote,
  Plus,
  Circle,
} from "lucide-react";

export const revalidate = 60;

type Category = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
};

type CategoryPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  _createdAt?: string;
  excerpt?: string;
  tags?: string[];
  categories?: Array<{ title?: string; slug?: string; _id?: string }>;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

const getCategory = cache(async (slug: string) =>
  client.fetch<Category | null>(categoryBySlugQuery, { slug })
);

const getDescription = (category: Category) =>
  category.description?.trim() || `Posts in ${category.title} on ${siteName}.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};

  const category = await getCategory(slug);
  if (!category?._id) return { title: "Category Not Found" };

  const description = getDescription(category);
  const canonical = `/categories/${category.slug || slug}`;

  return {
    title: `Category: ${category.title}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `Category: ${category.title}`,
      description,
      url: canonical,
      type: "website",
      siteName,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Category: ${category.title}`,
      description,
      images: [defaultOgImage],
    },
  };
}

const getTime = (v?: string) => (v ? new Date(v).getTime() : 0);

const buildPlaceholderTags = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("cyber") || t.includes("sci") || t.includes("mecha"))
    return ["SciFi", "Dystopia", "Mecha"];
  if (t.includes("romance")) return ["Love", "Drama", "Slice"];
  if (t.includes("sports")) return ["Hype", "Training", "Rivalry"];
  if (t.includes("horror")) return ["Fear", "Mystery", "Thriller"];
  if (t.includes("psych")) return ["Mind", "Themes", "Symbolism"];
  return ["Anime", "Editorial", "DeepDive"];
};

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sort?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const sortParam = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;

  if (!slug) return notFound();

  const category = await getCategory(slug);
  if (!category?._id) return notFound();

  const posts: CategoryPost[] = await client.fetch(blogsByCategoryQuery, {
    slug,
  });

  const sortKey =
    sortParam === "popular"
      ? "popular"
      : sortParam === "newest"
        ? "newest"
        : "newest";

  const sorted = [...(posts || [])].sort((a, b) => {
    if (sortKey === "popular") {
      const ta = (a.tags || []).length;
      const tb = (b.tags || []).length;
      if (tb !== ta) return tb - ta;
    }
    return (
      getTime(b.publishedAt || b._createdAt) -
      getTime(a.publishedAt || a._createdAt)
    );
  });

  const featured = sorted[0] || null;
  const rest = sorted.slice(1);

  const manifestTags =
    (featured?.tags?.slice(0, 3) && featured.tags.slice(0, 3)) ||
    buildPlaceholderTags(category.title);

  const words = category.title.trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0] || category.title;
  const secondWord = words.slice(1).join(" ") || "";

  return (
    <main className="bg-anime-ink text-anime-text overflow-x-hidden selection:bg-anime-lime selection:text-black">
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[520px] sm:w-[700px] md:w-[800px] h-[520px] sm:h-[700px] md:h-[800px] bg-anime-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[420px] sm:w-[520px] md:w-[600px] h-[420px] sm:h-[520px] md:h-[600px] bg-anime-cyan/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10 [background-size:40px_40px] [background-image:linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)]" />
      </div>

      <main className="relative w-full overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 z-10">
        {/* HEADER */}
        <header className="relative max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 md:mb-24">
          {/* breadcrumbs scroll on mobile */}
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto py-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex shrink-0 items-center gap-2 bg-black border border-white/15 px-4 py-2 rounded-full font-mono text-[10px] sm:text-xs uppercase tracking-widest text-white/60">
              <Link href="/" className="shrink-0">
                <span className="text-anime-red">Home</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-white/35 shrink-0" />
              <Link href="/categories" className="shrink-0">
                <span className="text-white">Categories</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-white/35 shrink-0" />
              <span className="shrink-0">{category.title}</span>
            </div>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-6 sm:mt-8">
            <div className="lg:col-span-8 relative">
              <div className="absolute -top-10 sm:-top-16 md:-top-20 -left-6 sm:-left-10 text-[5.5rem] sm:text-[8rem] md:text-[12rem] font-black text-white/5 select-none z-0 leading-none overflow-hidden whitespace-nowrap pointer-events-none blur-sm">
                {firstWord.toUpperCase()}
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-9xl font-black uppercase italic tracking-tight md:tracking-tighter leading-[0.95] sm:leading-[0.85] md:leading-[0.8] relative z-10 mix-blend-screen text-white break-words">
                {firstWord}
                <br />
                <span className="text-outline-red ml-2 sm:ml-6 md:ml-24 inline-block">
                  {secondWord || "Files"}
                </span>
              </h1>

              <div className="h-1.5 sm:h-2 bg-gradient-to-r from-anime-red via-anime-lime to-transparent w-full sm:w-11/12 md:w-3/4 mt-4 skew-x-12" />
            </div>

            <div className="lg:col-span-4 relative">
              <div className="bg-anime-panel border-l-4 border-anime-red p-5 sm:p-6 relative shadow-hard-blue transform lg:rotate-2 lg:hover:rotate-0 transition-all duration-300">
                <div className="absolute -top-3 -right-3 bg-anime-lime text-black size-8 flex items-center justify-center font-black border border-black z-20">
                  <Terminal className="h-4 w-4" />
                </div>
                <h2 className="font-black text-anime-cyan uppercase tracking-widest text-xs sm:text-sm mb-2">
                  Category Manifest
                </h2>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-mono">
                  {category.description?.trim()
                    ? category.description.trim()
                    : "Editorial analysis and focused coverage."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {manifestTags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="bg-black/60 border border-white/10 text-white text-[10px] px-2 py-1 uppercase"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* TOOLBAR (stack on mobile) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10 md:mb-12 relative z-20">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between border-y border-white/10 py-4 bg-black/20 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-anime-red font-black uppercase text-xs sm:text-sm">
                Sort By:
              </span>

              <div className="flex items-center gap-3">
                <Link
                  href={`/categories/${category.slug}?sort=newest`}
                  scroll={false}
                  className={
                    sortKey === "newest"
                      ? "text-white md:hover:text-anime-lime uppercase text-[11px] sm:text-xs font-black underline decoration-2 underline-offset-4"
                      : "text-white/40 md:hover:text-white uppercase text-[11px] sm:text-xs font-black"
                  }
                >
                  Newest
                </Link>

                <Link
                  href={`/categories/${category.slug}?sort=popular`}
                  scroll={false}
                  className={
                    sortKey === "popular"
                      ? "text-white md:hover:text-anime-lime uppercase text-[11px] sm:text-xs font-black underline decoration-2 underline-offset-4"
                      : "text-white/40 md:hover:text-white uppercase text-[11px] sm:text-xs font-black"
                  }
                >
                  Popular
                </Link>
              </div>
            </div>

            <div className="flex sm:hidden items-center gap-2">
              <span className="size-2 bg-anime-red rounded-full animate-pulse" />
              <span className="font-mono text-[10px] text-white/50 uppercase">
                Online
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="size-2 bg-anime-red rounded-full animate-pulse" />
              <span className="font-mono text-xs text-white/50 uppercase">
                System Status: Online
              </span>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 relative z-10 pb-20">
          {posts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 auto-rows-min">
              {/* FEATURED BIG */}
              {featured && (
                <Link
                  className="lg:col-span-8 group relative min-h-[420px] sm:min-h-[480px] md:min-h-[520px] border-4 border-black md:hover:border-anime-red transition-colors duration-300 overflow-hidden"
                  href={`/blog/${featured.slug}`}
                >
                  <article>
                    <div className="absolute inset-0">
                      {featured.mainImage?.asset?.url ? (
                        <Image
                          src={sanityImageUrl(featured.mainImage, {
                            width: 1800,
                          })}
                          alt={featured.mainImage.alt || featured.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 1100px"
                          className="object-cover transition-transform duration-700 md:group-hover:scale-105"
                          priority
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(242,13,13,0.25),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,243,255,0.18),transparent_55%)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>

                    <div className="absolute top-0 right-0 bg-anime-red text-white font-black px-4 sm:px-6 py-2 text-base sm:text-xl uppercase tracking-widest shadow-hard-white z-20">
                      Featured
                    </div>

                    <div className="absolute bottom-0 left-0 p-5 sm:p-7 md:p-8 w-full z-10">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                        <span className="bg-anime-cyan text-black font-black text-[10px] sm:text-xs px-2 py-1 uppercase border border-white">
                          {category.title}
                        </span>
                        <span className="text-white/80 font-mono text-[10px] sm:text-xs">
                          {formatDate(featured.publishedAt)}
                        </span>
                      </div>

                      <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase leading-[0.95] sm:leading-[0.88] md:leading-[0.85] mb-4 sm:mb-6 md:group-hover:text-anime-red transition-colors break-words">
                        {featured.title.split(" ").slice(0, 3).join(" ")}
                        {featured.title.split(" ").length > 3 ? (
                          <>
                            <br />
                            <span className="text-outline">
                              {featured.title.split(" ").slice(3).join(" ")}
                            </span>
                          </>
                        ) : null}
                      </h2>

                      <p className="max-w-xl text-white/70 text-sm sm:text-base md:text-lg mb-5 sm:mb-6 line-clamp-3">
                        {featured.excerpt ||
                          "A featured read from this category. Tap in for the full breakdown."}
                      </p>

                      <div className="inline-flex items-center gap-2 bg-white text-black font-black uppercase px-5 sm:px-6 py-3 text-xs sm:text-sm md:hover:bg-anime-red md:hover:text-white transition-all shadow-hard-green">
                        Jack In <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* FEATURED SIDE (not row-span on mobile) */}
              {rest[0] && (
                <Link
                  href={`/blog/${rest[0].slug}`}
                  className="lg:col-span-4 group relative min-h-[420px] sm:min-h-[520px] lg:min-h-[520px]"
                >
                  <article className="h-full">
                    <div className="h-full bg-anime-panel border border-white/15 p-2 flex flex-col relative overflow-hidden md:group-hover:border-anime-lime transition-colors">
                      <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur text-white border border-white/15 size-11 sm:size-12 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-anime-lime animate-bounce" />
                      </div>

                      <div className="relative h-52 sm:h-3/5 overflow-hidden mb-4 border border-white/10">
                        {rest[0].mainImage?.asset?.url ? (
                          <Image
                            src={sanityImageUrl(rest[0].mainImage, {
                              width: 1200,
                            })}
                            alt={rest[0].mainImage.alt || rest[0].title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 520px"
                            className="object-cover transition-transform duration-500 md:group-hover:scale-110 md:group-hover:rotate-2"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,255,0,0.18),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(242,13,13,0.18),transparent_55%)]" />
                        )}
                      </div>

                      <div className="flex-grow flex flex-col justify-between p-4 bg-anime-ink border-t border-white/10">
                        <div>
                          <span className="text-anime-lime font-mono text-[10px] sm:text-xs uppercase mb-2 block">
                            &gt; Essay
                          </span>
                          <h3 className="text-2xl sm:text-3xl font-black uppercase leading-none text-white mb-4 md:group-hover:text-anime-lime transition-colors">
                            {rest[0].title}
                          </h3>
                          <p className="text-white/45 text-xs sm:text-sm line-clamp-3">
                            {rest[0].excerpt ||
                              "A sharp read from this category. No fluff, just the point."}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-6 border-t border-dashed border-white/10 pt-4">
                          <div className="flex items-center gap-2">
                            <div className="size-6 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                              <Circle className="h-3 w-3 text-white/50" />
                            </div>
                            <span className="text-xs font-black text-white/55">
                              Rushabh
                            </span>
                          </div>
                          <span className="text-[10px] sm:text-xs font-mono text-white/35">
                            {formatDate(rest[0].publishedAt)}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-black uppercase text-anime-lime md:hover:underline underline-offset-4">
                            Read Now <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* 2 SMALL CARDS */}
              {rest.slice(1, 3).map((p, idx) => (
                <Link
                  key={p._id}
                  href={`/blog/${p.slug}`}
                  className="lg:col-span-4 group"
                >
                  <article>
                    <div className="bg-black border-2 border-white/15 p-1 transform transition-all duration-300 md:hover:-translate-y-2 shadow-hard-blue">
                      <div className="aspect-video relative overflow-hidden bg-black mb-4 border border-white/10">
                        {p.mainImage?.asset?.url ? (
                          <Image
                            src={sanityImageUrl(p.mainImage, { width: 1200 })}
                            alt={p.mainImage.alt || p.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 520px"
                            className="object-cover transition-all duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(242,13,13,0.25),transparent_60%),linear-gradient(315deg,rgba(0,243,255,0.18),transparent_60%)]" />
                        )}

                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-2">
                          <span
                            className={
                              idx % 2 === 0
                                ? "bg-anime-red text-white text-[10px] font-black px-1 uppercase"
                                : "bg-anime-cyan text-black text-[10px] font-black px-1 uppercase"
                            }
                          >
                            {idx % 2 === 0 ? "News" : "Review"}
                          </span>
                        </div>
                      </div>

                      <div className="px-2 pb-2">
                        <h3 className="text-lg sm:text-xl font-black uppercase leading-tight text-white mb-2 md:group-hover:text-anime-cyan break-words">
                          {p.title}
                        </h3>
                        <p className="text-xs text-white/50 mb-3 line-clamp-2">
                          {p.excerpt || "Quick hit from the category feed."}
                        </p>
                        <div className="text-anime-cyan text-xs font-black uppercase tracking-widest md:hover:underline underline-offset-4">
                          Read Now
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}

              {/* QUOTE CARD */}
              {rest[3] && (
                <Link
                  href={`/blog/${rest[3].slug}`}
                  className="lg:col-span-4 group relative z-10"
                >
                  <article>
                    <div className="bg-anime-lime p-1 transform rotate-1 sm:rotate-2 md:hover:rotate-0 transition-all duration-300 shadow-lg md:hover:z-20">
                      <div className="bg-black p-4 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <Quote className="h-9 w-9 sm:h-10 sm:w-10 text-anime-lime" />
                          <span className="font-mono text-[10px] sm:text-xs text-white/40">
                            {formatDate(rest[3].publishedAt)}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase leading-tight text-white mb-4 line-clamp-4">
                          “{rest[3].title}”
                        </h3>
                        <div className="mt-auto pt-4 border-t border-white/10">
                          <p className="font-black text-anime-lime text-sm uppercase">
                            - From this category
                          </p>
                          <p className="text-white/45 text-xs uppercase">
                            Tap it, read the full thing
                          </p>

                          <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase text-white border border-white px-3 py-2 md:hover:bg-white md:hover:text-black transition-colors">
                            Open <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* BIG HORIZONTAL BREAKING */}
              {rest[4] && (
                <Link
                  href={`/blog/${rest[4].slug}`}
                  className="lg:col-span-12 group mt-2"
                >
                  <article>
                    <div className="relative bg-anime-panel border-y-4 border-anime-red overflow-hidden md:hover:bg-black/40 transition-colors">
                      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black to-transparent z-10 hidden md:block" />
                      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center p-6 sm:p-8 relative z-20">
                        <div className="order-2 md:order-1">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="size-3 bg-anime-red rounded-full animate-ping" />
                            <span className="font-black text-anime-red uppercase tracking-[0.2em] text-xs sm:text-sm">
                              Breaking
                            </span>
                          </div>

                          <h3 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic text-white mb-4 break-words">
                            {rest[4].title.split(" ").slice(0, 2).join(" ")}
                            <br />
                            <span className="text-white/30">
                              {rest[4].title.split(" ").slice(2).join(" ")}
                            </span>
                          </h3>

                          <p className="text-white/55 mb-6 max-w-md text-sm sm:text-base line-clamp-3">
                            {rest[4].excerpt ||
                              "A longer breakdown built for a full read. Grab context first, then opinions."}
                          </p>

                          <div className="inline-block border-2 border-white text-white px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase md:hover:bg-white md:hover:text-black transition-colors">
                            Full Breakdown
                          </div>
                        </div>

                        <div className="order-1 md:order-2 h-56 sm:h-64 md:h-full relative border border-white/10 overflow-hidden">
                          {rest[4].mainImage?.asset?.url ? (
                            <Image
                              src={sanityImageUrl(rest[4].mainImage, {
                                width: 1400,
                              })}
                              alt={rest[4].mainImage.alt || rest[4].title}
                              fill
                              sizes="(max-width: 1024px) 100vw, 700px"
                              className="object-cover opacity-75"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(242,13,13,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,243,255,0.16),transparent_55%)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* LIST ROW of SMALL BOOKMARK CARDS */}
              {rest.slice(5, 8).map((p) => (
                <Link
                  href={`/blog/${p.slug}`}
                  className="lg:col-span-4 group"
                  key={p._id}
                >
                  <article>
                    <div className="bg-white/5 border border-white/15 md:hover:border-white transition-all p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2">
                        <Bookmark className="h-5 w-5 text-white/25 md:group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex gap-4">
                        <div className="w-20 sm:w-24 h-20 sm:h-24 flex-shrink-0 relative border border-white/15 bg-black overflow-hidden">
                          {p.mainImage?.asset?.url ? (
                            <Image
                              src={sanityImageUrl(p.mainImage, { width: 600 })}
                              alt={p.mainImage.alt || p.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-black text-anime-red uppercase mb-1 block">
                            {category.title}
                          </span>
                          <h4 className="font-black text-white uppercase leading-tight mb-2 md:group-hover:underline underline-offset-4 break-words">
                            {p.title}
                          </h4>
                          <span className="text-xs text-white/40">
                            {formatDate(p.publishedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-anime-cyan text-xs font-black uppercase tracking-widest md:hover:underline underline-offset-4">
                          Read Now
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}

              {/* WIDE ESSAY */}
              {rest[8] && (
                <Link
                  href={`/blog/${rest[8].slug}`}
                  className="lg:col-span-8 group relative mt-2"
                >
                  <article>
                    <div className="flex flex-col md:flex-row h-full bg-black border-2 border-white/15 md:hover:shadow-hard-green transition-all overflow-hidden">
                      <div className="md:w-1/2 relative min-h-[220px] sm:min-h-[280px] md:min-h-[300px]">
                        {rest[8].mainImage?.asset?.url ? (
                          <Image
                            src={sanityImageUrl(rest[8].mainImage, {
                              width: 1400,
                            })}
                            alt={rest[8].mainImage.alt || rest[8].title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 760px"
                            className="object-cover transition-all duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,255,0,0.15),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(242,13,13,0.2),transparent_55%)]" />
                        )}
                        <div className="absolute inset-0 opacity-30 [background-size:40px_40px] [background-image:linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)]" />
                      </div>

                      <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-center relative">
                        <div className="absolute -left-3 top-8 size-6 bg-anime-lime rotate-45 border-2 border-black z-10 hidden md:block" />

                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-4 md:group-hover:text-anime-lime transition-colors break-words">
                          {rest[8].title}
                        </h3>

                        <p className="text-white/55 text-sm mb-6 line-clamp-3">
                          {rest[8].excerpt ||
                            "A focused essay from this category. Built to be read slowly."}
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="h-px bg-white/15 flex-grow" />
                          <div className="text-xs font-black uppercase text-white border border-white px-3 py-2 md:hover:bg-white md:hover:text-black transition-colors">
                            Read Essay
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )}
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="border-2 border-white/15 bg-black/40 p-6 shadow-hard-white">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-white/70">
                  No posts in this category yet.
                </p>
                <div className="mt-4">
                  <Link
                    href="/blogs"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase text-anime-lime md:hover:underline underline-offset-4"
                  >
                    Browse all blogs <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* LOAD MORE (UI only) */}
          {posts.length > 10 ? (
            <div className="mt-12 sm:mt-20 flex justify-center px-4">
              <button className="relative group overflow-hidden w-full sm:w-auto px-7 sm:px-12 py-4 sm:py-6 bg-transparent border-2 border-white/15 md:hover:border-anime-red transition-colors">
                <span className="absolute top-0 left-0 w-full h-full bg-anime-red -translate-x-full md:group-hover:translate-x-0 transition-transform duration-300 ease-in-out z-0" />
                <span className="relative z-10 text-base sm:text-xl font-black uppercase tracking-[0.22em] sm:tracking-[0.3em] text-white md:group-hover:text-black">
                  Load More Data
                </span>
                <span className="absolute -bottom-2 -right-2 text-6xl text-white/10 md:group-hover:text-black/20 font-black z-0 transition-colors">
                  <Plus className="h-10 w-10" />
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </main>
  );
}
