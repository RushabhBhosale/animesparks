import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { blogBySlugQuery, relatedBlogsQuery } from "@/sanity/blogQueries";

type Post = {
  _id: string;
  title: string;
  body: any;
  tags?: string[];
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: { name?: string; slug?: string };
  faq?: { question?: string; answer?: string }[];
};

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post: Post | null = await client.fetch(blogBySlugQuery, { slug });

  if (!post?._id) return notFound();

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/blog"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Back to Blog
        </Link>
      </div>

      {post.mainImage?.asset?.url ? (
        <img
          src={post.mainImage.asset.url}
          alt={post.mainImage.alt || post.title}
          className="mb-6 h-72 w-full rounded-2xl border border-neutral-200 object-cover"
        />
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(post.categories || []).slice(0, 2).map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {c.title}
          </Link>
        ))}
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
        {post.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
        {post.author?.name ? <span>By {post.author.name}</span> : null}
        {post.publishedAt ? <span className="text-neutral-400">•</span> : null}
        {post.publishedAt ? (
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        ) : null}
      </div>

      <article className="prose prose-neutral mt-8 max-w-none prose-headings:tracking-tight prose-a:underline-offset-4">
        <PortableText value={post.body} />
      </article>

      {post.tags?.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Tags
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                #{t}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {post.faq?.length ? (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-neutral-900">FAQ</h2>
          <div className="mt-4 space-y-3">
            {post.faq.map((item, idx) => (
              <details
                key={`${item.question}-${idx}`}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                  {item.question}
                </summary>
                {item.answer ? (
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {item.answer}
                  </p>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {related?.length ? (
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Related posts
          </h2>
          <div className="mt-4 grid gap-3">
            {related.map((p: any) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="rounded-xl border border-neutral-200 p-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
