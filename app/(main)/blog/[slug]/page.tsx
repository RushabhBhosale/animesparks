import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { blogBySlugQuery, relatedBlogsQuery } from "@/sanity/blogQueries";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { FaqJsonLd } from "@/components/seo/faq-jsonld";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { cache } from "react";
import { formatDate } from "@/utils/date";
import {
  defaultOgImage,
  getBaseUrl,
  siteAuthorName,
  siteAuthorUrl,
  siteName,
} from "@/utils/seo";
import { ViewTracker } from "@/components/analytics/view-tracker";
import Image from "next/image";

export const revalidate = 60;

type Post = {
  _id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  body: any;
  tags?: string[];
  publishedAt?: string;
  _updatedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: { name?: string; slug?: string };
  faq?: { question?: string; answer?: string }[];
  viewCount?: number;
};

type RelatedPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

const getDescription = (metaDescription?: string, excerpt?: string) => {
  const source = metaDescription || excerpt;
  if (!source) return undefined;
  const trimmed = source.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

const insertInlineAd = (blocks: any) => {
  if (!Array.isArray(blocks)) return blocks;
  let paragraphCount = 0;
  const insertAfter = new Set([2, 6]);
  const output: any[] = [];

  for (const block of blocks) {
    output.push(block);
    if (
      block?._type === "block" &&
      (block.style === "normal" || !block.style)
    ) {
      paragraphCount += 1;
      if (insertAfter.has(paragraphCount)) {
        output.push({
          _type: "adSlot",
          _key: `ad-inline-${paragraphCount}`,
        });
      }
    }
  }

  return output;
};

const getPost = cache(async (slug: string) =>
  client.fetch<Post | null>(blogBySlugQuery, { slug })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};

  const post = await getPost(slug);
  if (!post?._id) {
    return { title: "Post Not Found" };
  }

  const baseUrl = getBaseUrl();
  const seoTitle = (post.metaTitle || "").trim() || post.title;
  const canonical = `${baseUrl}/blog/${post.slug}`;
  const description =
    getDescription(post.metaDescription, post.excerpt) ||
    `Read ${post.title} on ${siteName}.`;

  const mainImageUrl = post.mainImage?.asset
    ? sanityHeroImageUrl(post.mainImage)
    : undefined;

  const ogImage = mainImageUrl || new URL(defaultOgImage, baseUrl).toString();

  return {
    title: seoTitle,
    description,
    alternates: {
      canonical,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: seoTitle,
      description,
      url: canonical,
      type: "article",
      siteName,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await getPost(slug);

  if (!post?._id) return notFound();

  const baseUrl = getBaseUrl();
  const seoTitle = (post.metaTitle || "").trim() || post.title;
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const description =
    getDescription(post.metaDescription, post.excerpt) ||
    `Read ${post.title} on ${siteName}.`;
  const mainImageUrl = post.mainImage?.asset
    ? sanityHeroImageUrl(post.mainImage)
    : undefined;
  const faqItems =
    post.faq
      ?.map((item) => ({
        question: item.question?.trim() || "",
        answer: item.answer?.trim() || "",
      }))
      .filter((item) => item.question && item.answer) || [];

  const categoryIds = (post.categories || [])
    .map((c) => c?._id)
    .filter(Boolean);
  const viewCount = post.viewCount ?? 0;

  const related =
    categoryIds.length > 0
      ? await client.fetch<RelatedPost[]>(relatedBlogsQuery, {
          currentId: post._id,
          categoryIds,
        })
      : [];
  const nextBlog = related[0];
  const sidebarRelated = nextBlog ? related.slice(1) : related;
  const bodyWithAds = insertInlineAd(post.body);

  return (
    <main className="blog-page min-h-screen bg-[#050505] text-[#f0f0f0]">
      <ViewTracker slug={post.slug} />
      <ArticleJsonLd
        url={canonicalUrl}
        title={seoTitle}
        description={description}
        image={mainImageUrl}
        datePublished={post.publishedAt}
        dateModified={post._updatedAt}
        authorName={post.author?.name || siteAuthorName}
        authorUrl={siteAuthorUrl}
      />
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", item: `${baseUrl}/home` },
          { name: "Blog", item: `${baseUrl}/blog` },
          { name: post.title, item: canonicalUrl },
        ]}
      />
      {faqItems.length ? <FaqJsonLd items={faqItems} /> : null}
      {/* Featured Image Hero */}
      {mainImageUrl && (
        <div className="relative h-100 w-full overflow-hidden bg-black lg:h-125">
          <Image
            src={mainImageUrl}
            alt={post.mainImage?.alt || post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 768px, 860px"
            fetchPriority="high"
            quality={60}
            className="object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Breadcrumb */}
        <div className="border-b border-gray-200 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="font-semibold text-gray-600 md:hover:text-red-600 transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-400">/</span>
            {post.categories?.[0] && (
              <>
                <Link
                  href={`/categories/${post.categories[0].slug}`}
                  className="font-semibold text-gray-600 md:hover:text-red-600 transition-colors text-nowrap"
                >
                  {post.categories[0].title}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-400 truncate">{post.title}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-12 md:gap-10 lg:gap-12">
          {/* Main Content */}
          <article className="md:col-span-8 lg:col-span-8">
            {/* Category Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(post.categories || []).slice(0, 3).map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="inline-flex self-start bg-black border border-[#f20d0d] px-3 py-1 -rotate-2 shadow-[8px_8px_0px_0px_rgba(242,13,13,1)]"
                >
                  <span className="text-[#f20d0d] font-black uppercase text-xs tracking-[0.2em]">
                    {c.title}
                  </span>
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-4">
              {post.author?.name && (
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {post.author.name}
                    </p>
                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt}
                        className="text-xs text-gray-500"
                      >
                        {new Date(post.publishedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </time>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
                {viewCount.toLocaleString()} views
              </div>

              {/* Social Share Icons */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Share:
                </span>
                <button
                  type="button"
                  className="rounded-sm bg-gray-100 p-2 md:hover:bg-gray-200 transition-colors"
                  aria-label="Share on Facebook"
                >
                  <svg
                    className="h-4 w-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded-sm bg-gray-100 p-2 md:hover:bg-gray-200 transition-colors"
                  aria-label="Share on Twitter/X"
                >
                  <svg
                    className="h-4 w-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Article Body */}
            <div className="blogContent prose prose-lg prose-neutral mt-8 max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-800 prose-p:leading-relaxed prose-a:font-semibold prose-a:text-red-600 prose-a:underline prose-a:underline-offset-4 prose-a:decoration-2 prose-a:decoration-red-200 prose-a:rounded-sm prose-a:px-0.5 prose-a:transition-colors md:hover:prose-a:text-red-700 md:hover:prose-a:decoration-red-500 md:hover:prose-a:bg-red-50 prose-strong:font-bold prose-strong:text-gray-900">
              <PortableText
                value={bodyWithAds}
                components={{
                  types: {
                    adSlot: () => (
                      <div
                        className="my-10 not-prose"
                        aria-label="Advertisement"
                      >
                        <AdSlot variant="inline" className="min-h-62.5" />
                      </div>
                    ),
                    image: ({ value }) => {
                      if (!value?.asset) return null;
                      const src = sanityImageUrl(value, { width: 1200 });

                      return (
                        <figure className="my-8">
                          <div className="relative aspect-video w-full overflow-hidden rounded-sm">
                            <Image
                              src={src}
                              alt={value.alt || ""}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 768px, 860px"
                              className="object-cover"
                              loading="lazy"
                              quality={75}
                            />
                          </div>
                          {value.alt && (
                            <figcaption className="mt-2 text-center text-sm text-gray-500">
                              {value.alt}
                            </figcaption>
                          )}
                        </figure>
                      );
                    },
                  },
                  block: {
                    h2: ({ children }) => (
                      <h2 className="mt-12 mb-4 text-3xl font-black tracking-tight text-gray-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-10 mb-3 text-2xl font-black text-gray-900">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="mt-8 mb-2 text-xl font-bold text-gray-900">
                        {children}
                      </h4>
                    ),
                    normal: ({ children }) => (
                      <p className="mb-6 text-lg leading-relaxed text-gray-800">
                        {children}
                      </p>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-8 border-l-4 border-red-600 bg-gray-50 pl-6 py-4 italic text-gray-700">
                        {children}
                      </blockquote>
                    ),
                  },
                  list: {
                    bullet: ({ children }) => (
                      <ul className="my-6 list-disc list-outside space-y-2 pl-6">
                        {children}
                      </ul>
                    ),
                    number: ({ children }) => (
                      <ol className="my-6 list-decimal list-outside space-y-2 pl-6">
                        {children}
                      </ol>
                    ),
                  },
                  listItem: {
                    bullet: ({ children }) => (
                      <li className="text-lg leading-relaxed text-gray-800 marker:text-gray-500">
                        {children}
                      </li>
                    ),
                    number: ({ children }) => (
                      <li className="text-lg leading-relaxed text-gray-800 marker:text-gray-500">
                        {children}
                      </li>
                    ),
                  },
                }}
              />
            </div>

            {/* Tags */}
            {post.tags?.length ? (
              <section className="mt-12 border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-gray-900">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/tags/${encodeURIComponent(t)}`}
                      className="rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 md:hover:bg-gray-50 md:hover:border-red-600 md:hover:text-red-600 transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <AdSlot variant="full" className="mt-12 not-prose" />

            {/* FAQ */}
            {post.faq?.length ? (
              <section className="mt-12 rounded-sm border border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-6 text-2xl font-black text-gray-900">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {post.faq.map((item, idx) => (
                    <details
                      key={`${item.question}-${idx}`}
                      className="group rounded-sm border border-gray-200 bg-white p-5"
                    >
                      <summary className="cursor-pointer text-base font-bold text-gray-900 flex items-start justify-between">
                        <span className="pr-4">{item.question}</span>
                        <svg
                          className="h-5 w-5 shrink-0 text-red-600 transition-transform group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      {item.answer && (
                        <p className="mt-4 leading-relaxed text-gray-700">
                          {item.answer}
                        </p>
                      )}
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Next Blog */}
            {nextBlog ? (
              <section className="mt-14">
                <div className="overflow-hidden rounded-sm mt-5 border border-anime-muted bg-black text-white shadow-[12px_12px_0px_0px_#f20d0d]">
                  <div className="grid gap-0 md:grid-cols-5">
                    <div className="relative h-52 md:col-span-2 md:h-full">
                      {nextBlog.mainImage?.asset?.url ? (
                        <Image
                          src={sanityImageUrl(nextBlog.mainImage, {
                            width: 1200,
                            quality: 70,
                          })}
                          alt={nextBlog.mainImage.alt || nextBlog.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 720px"
                          className="object-cover opacity-80"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center gap-2 rounded-sm bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                          Next in {post.categories?.[0]?.title || "AnimeSparks"}
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-3 p-6 md:p-8 flex flex-col gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f20d0d]">
                        Next up
                      </p>

                      <h2 className="text-2xl md:text-3xl font-black leading-tight text-white line-clamp-3">
                        {nextBlog.title}
                      </h2>

                      {nextBlog.excerpt ? (
                        <p className="text-sm leading-relaxed text-gray-300 line-clamp-3">
                          {nextBlog.excerpt}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
                        {nextBlog.publishedAt ? (
                          <span>Filed {formatDate(nextBlog.publishedAt)}</span>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        <Link
                          href={`/blog/${nextBlog.slug}`}
                          className="group inline-flex items-center justify-between gap-3 rounded-sm border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white md:hover:border-[#f20d0d] md:hover:bg-[#f20d0d]/10 transition-colors"
                        >
                          <span>Read next</span>
                          <span
                            aria-hidden="true"
                            className="text-[#f20d0d] group-hover:translate-x-0.5 transition-transform"
                          >
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </article>

          {/* Sidebar */}
          <aside className="md:col-span-4 lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              {/* Related Posts */}
              {sidebarRelated.length ? (
                <section className="rounded-sm border border-gray-200 bg-white p-5">
                  <h3 className="mb-5 text-lg font-black uppercase tracking-tight text-gray-900">
                    Related Blogs
                  </h3>
                  <div className="space-y-4">
                    {sidebarRelated.map((p: RelatedPost) => (
                      <Link
                        key={p._id || p.slug}
                        href={`/blog/${p.slug}`}
                        className="group block border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex gap-3">
                          {p.mainImage?.asset?.url && (
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm bg-gray-200">
                              <Image
                                src={sanityImageUrl(p.mainImage, {
                                  width: 400,
                                  quality: 60,
                                })}
                                alt={p.mainImage.alt || p.title}
                                fill
                                sizes="(max-width: 768px) 40vw, 160px"
                                className="object-cover transition-transform duration-300 md:group-hover:scale-110"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold leading-tight text-gray-900 line-clamp-3 md:group-hover:text-red-600 transition-colors">
                              {p.title}
                            </h4>
                            {p.publishedAt && (
                              <p className="mt-1 text-xs text-gray-500">
                                {formatDate(p.publishedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <AdSlot variant="sidebar" />

              {/* Newsletter Signup */}
              <div className="rounded-sm border-2 border-red-600 bg-white p-6">
                <h3 className="text-lg font-black text-gray-900">
                  Subscribe to Our Newsletter
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Get the latest articles delivered straight to your inbox.
                </p>
                <form className="mt-4 space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full rounded-sm border border-gray-300 px-4 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white md:hover:bg-red-700 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
