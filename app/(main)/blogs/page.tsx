import Link from "next/link";
import clsx from "clsx";
import { client } from "@/sanity/lib/client";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { blogsQuery, categoriesQuery } from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";

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

type BlogCategory = {
  _id: string;
  title: string;
  slug: string;
};

type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  mainImage?: {
    asset?: { url?: string };
    alt?: string;
  };
  categories?: BlogCategory[];
  tags?: string[];
  _createdAt?: string;
};

export default async function AllBlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = (await searchParams) || {};
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
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Latest Articles"
        title="All Blogs"
        description="Deep dives, reviews, and analysis from AnimeSparks — updated constantly with the stories we obsess over."
        backgroundImage="/blogs-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 space-y-12">
        <AdSlot variant="full" />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-8 space-y-10">
            {featured && (
              <section className="grid gap-6 md:grid-cols-12 border border-[#1f1f1f] bg-[#0b0b0b] p-4 md:p-6">
                <div className="md:col-span-7 relative overflow-hidden bg-black">
                  {featured.mainImage?.asset?.url && (
                    <div className="relative h-64 w-full md:h-full">
                      <Image
                        src={sanityHeroImageUrl(featured.mainImage)}
                        alt={featured.mainImage.alt || featured.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 960px"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full bg-[#f20d0d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[4px_4px_0px_0px_#000]">
                      Featured
                    </span>
                    {featured.categories?.[0] && (
                      <span className="rounded-full border border-[#1f1f1f] bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-200">
                        {featured.categories[0].title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col justify-center gap-4">
                  <Link href={`/blog/${featured.slug}`} className="group">
                    <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight tracking-tight group-hover:text-[#ccff00] transition-colors">
                      {featured.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-gray-400">{formatDate(featured.publishedAt)}</p>
                  <p className="text-base text-gray-300">
                    {featured.excerpt ??
                      "An editorial spotlight chosen by our team. Expect strong takes and thoughtful analysis."}
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#f20d0d] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-[#ccff00] hover:text-black transition-colors"
                    >
                      Read Feature
                    </Link>
                    {featured.categories?.[0] && (
                      <Link
                        href={`/categories/${featured.categories[0].slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[#1f1f1f] bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
                      >
                        {featured.categories[0].title}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-8">
              <div className="flex items-center gap-4 border-b border-[#1f1f1f] overflow-x-auto pb-2">
                {[
                  { label: "All Posts", value: "all" },
                  { label: "Most Recent", value: "recent" },
                  { label: "Popular", value: "popular" },
                ].map((tab) => {
                  const isActive = activeSort === tab.value;
                  const href =
                    tab.value === "all" ? "/blogs" : `/blogs?sort=${tab.value}`;
                  return (
                    <Link
                      key={tab.value}
                      href={href}
                      scroll={false}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "shrink-0 pb-3 text-xs font-black uppercase tracking-[0.2em]",
                        isActive
                          ? "text-[#ccff00] border-b-2 border-[#ccff00]"
                          : "text-gray-500 hover:text-white"
                      )}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>

              <div className="space-y-8">
                {allPosts.map((post: BlogPost, index: number) => {
                  const isLarge = (index + 1) % 4 === 0;

                  if (isLarge) {
                    return (
                      <Link
                        key={post._id}
                        href={`/blog/${post.slug}`}
                        className="group block border border-[#1f1f1f] bg-[#0b0b0b] p-4 md:p-5"
                      >
                        {post.mainImage?.asset?.url && (
                          <div className="relative h-64 w-full overflow-hidden bg-black">
                            <Image
                              src={sanityHeroImageUrl(post.mainImage)}
                              alt={post.mainImage.alt || post.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 1200px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        )}
                        <div className="mt-4 flex flex-col gap-2">
                          {post.categories?.[0] && (
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                              {post.categories[0].title}
                            </span>
                          )}
                          <h3 className="text-2xl font-black uppercase leading-tight tracking-tight text-white group-hover:text-[#ccff00] transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs font-mono uppercase text-gray-500">
                            {formatDate(post.publishedAt)}
                          </p>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group flex gap-4 border border-[#1f1f1f] bg-[#0b0b0b] p-4 md:p-5"
                    >
                      {post.mainImage?.asset?.url && (
                        <div className="relative h-24 w-32 shrink-0 overflow-hidden bg-black sm:h-28 sm:w-40">
                          <Image
                            src={sanityImageUrl(post.mainImage, { width: 800 })}
                            alt={post.mainImage.alt || post.title}
                            fill
                            sizes="(max-width: 768px) 92vw, 420px"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="flex flex-col justify-center gap-2">
                        {post.categories?.[0] && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                            {post.categories[0].title}
                          </span>
                        )}
                        <h3 className="text-lg sm:text-xl font-black uppercase leading-tight text-white group-hover:text-[#ccff00] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs font-mono uppercase text-gray-500">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <button className="inline-flex items-center gap-2 rounded-full border-2 border-[#1f1f1f] bg-[#0b0b0b] px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:border-[#ccff00] hover:text-[#ccff00] hover:shadow-[0_0_0_2px_#ccff00]">
                  Load More Articles
                  <span className="text-[#ccff00]">+</span>
                </button>
              </div>

              <AdSlot variant="inline" className="mt-8" />
            </section>
          </div>

          <aside className="md:col-span-4 space-y-6">
            {categories.length > 0 && (
              <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                  Browse by Category
                </h3>
                <div className="space-y-2">
                  {categories.map((cat: BlogCategory) => (
                    <Link
                      key={cat._id}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-center justify-between border-b border-[#1f1f1f] pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-[#ccff00] transition-colors">
                        {cat.title}
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-[#ccff00] transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <AdSlot variant="sidebar" />

            <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-6">
              <h3 className="text-lg font-black uppercase text-white">
                Never Miss a Blog
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Subscribe for editorials, breakdowns, and trending anime stories.
              </p>
              <form className="mt-4 space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full rounded-sm border border-[#2a2a2a] bg-black px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#ccff00] focus:outline-none focus:ring-1 focus:ring-[#ccff00]"
                />
                <button
                  type="submit"
                  className="w-full rounded-sm bg-[#f20d0d] px-4 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ccff00] hover:text-black"
                >
                  Subscribe Now
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-500">
                Zero spam. Only the stories worth reading.
              </p>
            </section>

            <AdSlot variant="sidebar" />

            {popularTags.length > 0 && (
              <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-5">
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="rounded-full border border-[#2a2a2a] bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-200 hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="border border-[#1f1f1f] bg-[#0b0b0b] p-5">
              <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-white">
                Follow Us
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {["Facebook", "Twitter", "Instagram", "YouTube"].map((label) => (
                  <a
                    key={label}
                    href="#"
                    className="flex items-center justify-center rounded-sm border border-[#2a2a2a] bg-black px-3 py-2.5 text-sm font-semibold text-gray-200 hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
