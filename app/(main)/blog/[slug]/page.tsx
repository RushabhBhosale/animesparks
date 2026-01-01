import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { blogBySlugQuery, relatedBlogsQuery } from "@/sanity/blogQueries";
import { urlFor } from "@/sanity/lib/image";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { FaqJsonLd } from "@/components/seo/faq-jsonld";

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: any;
  tags?: string[];
  publishedAt?: string;
  _updatedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: { name?: string; slug?: string };
  faq?: { question?: string; answer?: string }[];
};

const getBaseUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return siteUrl.replace(/\/$/, "");
};

const getDescription = (excerpt?: string) => {
  if (!excerpt) return undefined;
  const trimmed = excerpt.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post: Post | null = await client.fetch(blogBySlugQuery, { slug });

  if (!post?._id) return notFound();

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const description = getDescription(post.excerpt);
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

  const related =
    categoryIds.length > 0
      ? await client.fetch(relatedBlogsQuery, {
          currentId: post._id,
          categoryIds,
        })
      : [];

  return (
    <main className="min-h-screen bg-white">
      <ArticleJsonLd
        url={canonicalUrl}
        title={post.title}
        description={description}
        image={post.mainImage?.asset?.url}
        datePublished={post.publishedAt}
        dateModified={post._updatedAt}
        authorName={post.author?.name}
      />
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", item: `${baseUrl}/home` },
          { name: "Blogs", item: `${baseUrl}/blogs` },
          { name: post.title, item: canonicalUrl },
        ]}
      />
      {faqItems.length ? <FaqJsonLd items={faqItems} /> : null}
      {/* Featured Image Hero */}
      {post.mainImage?.asset?.url && (
        <div className="relative h-100 w-full overflow-hidden bg-black lg:h-125">
          <img
            src={post.mainImage.asset.url}
            alt={post.mainImage.alt || post.title}
            className="h-full w-full object-cover object-center opacity-70"
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
              className="font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-400">/</span>
            {post.categories?.[0] && (
              <>
                <Link
                  href={`/categories/${post.categories[0].slug}`}
                  className="font-semibold text-gray-600 hover:text-red-600 transition-colors"
                >
                  {post.categories[0].title}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-400 truncate">{post.title}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-12 lg:gap-12">
          {/* Main Content */}
          <article className="lg:col-span-8">
            {/* Category Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(post.categories || []).slice(0, 3).map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="rounded-sm bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors"
                >
                  {c.title}
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

              {/* Social Share Icons */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Share:
                </span>
                <button className="rounded-sm bg-gray-100 p-2 hover:bg-gray-200 transition-colors">
                  <svg
                    className="h-4 w-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button className="rounded-sm bg-gray-100 p-2 hover:bg-gray-200 transition-colors">
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
            <div className="prose prose-lg prose-neutral mt-8 max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-800 prose-p:leading-relaxed prose-a:font-semibold prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-bold prose-strong:text-gray-900">
              <PortableText
                value={post.body}
                components={{
                  types: {
                    image: ({ value }) => {
                      if (!value?.asset) return null;
                      const src = urlFor(value)
                        .width(1200)
                        .fit("max")
                        .auto("format")
                        .url();

                      if (!src) return null;

                      return (
                        <figure className="my-8">
                          <img
                            src={src}
                            alt={value.alt || ""}
                            className="w-full rounded-sm object-cover"
                            loading="lazy"
                          />
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
                      <ul className="my-6 space-y-2 pl-6">{children}</ul>
                    ),
                    number: ({ children }) => (
                      <ol className="my-6 space-y-2 pl-6">{children}</ol>
                    ),
                  },
                  listItem: {
                    bullet: ({ children }) => (
                      <li className="text-lg text-gray-800">{children}</li>
                    ),
                    number: ({ children }) => (
                      <li className="text-lg text-gray-800">{children}</li>
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
                      className="rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-red-600 hover:text-red-600 transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

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
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              {/* Related Posts */}
              {related?.length ? (
                <section className="rounded-sm border border-gray-200 bg-white p-5">
                  <h3 className="mb-5 text-lg font-black uppercase tracking-tight text-gray-900">
                    Related Stories
                  </h3>
                  <div className="space-y-5">
                    {related.map((p: any) => (
                      <Link
                        key={p.slug}
                        href={`/blog/${p.slug}`}
                        className="group block border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                      >
                        <h4 className="text-sm font-bold leading-tight text-gray-900 line-clamp-3 group-hover:text-red-600 transition-colors">
                          {p.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Ad Space Placeholder */}
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-400 uppercase">
                  Advertisement
                </p>
                <div className="mt-4 h-64 bg-gray-200 rounded-sm flex items-center justify-center">
                  <span className="text-gray-400">300x250</span>
                </div>
              </div>

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
                    className="w-full rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700 transition-colors"
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
