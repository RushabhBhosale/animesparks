import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import {
  blogsByCategoryQuery,
  categoryBySlugQuery,
} from "@/sanity/blogQueries";
import { formatDate } from "@/utils/date";
import type { Metadata } from "next";
import { cache } from "react";
import { defaultOgImage, siteName } from "@/utils/seo";

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
  mainImage?: { asset?: { url?: string }; alt?: string };
};

const getCategory = cache(async (slug: string) =>
  client.fetch<Category | null>(categoryBySlugQuery, { slug })
);

const getDescription = (category: Category) =>
  category.description?.trim() ||
  `Posts in ${category.title} on ${siteName}.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};

  const category = await getCategory(slug);
  if (!category?._id) {
    return { title: "Category Not Found" };
  }

  const description = getDescription(category);
  const canonical = `/categories/${category.slug || slug}`;

  return {
    title: category.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: category.title,
      description,
      url: canonical,
      type: "website",
      siteName,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: category.title,
      description,
      images: [defaultOgImage],
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  const category = await getCategory(slug);

  if (!category?._id) return notFound();

  const posts: CategoryPost[] = await client.fetch(blogsByCategoryQuery, {
    slug,
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-linear-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/anime-poster.jpg")',
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              Category
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            {category.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            {category.description || "Editorial analysis and focused coverage."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-red-600" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Posts
            </h2>
          </div>

          {posts.length ? (
            <div className="space-y-8">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-center"
                >
                  {post.mainImage?.asset?.url ? (
                    <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-sm bg-gray-200 sm:h-32 sm:w-56">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                      {category.title}
                    </span>
                    <h3 className="mt-2 text-xl font-black leading-tight text-gray-900 transition-colors group-hover:text-red-600 sm:text-2xl">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-600">
              No posts in this category yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
