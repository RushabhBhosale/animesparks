import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { categoriesWithCountsQuery } from "@/sanity/blogQueries";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Anime Categories Reviews Lists and Genres",
  description:
    "Explore anime articles by category including shounen sports psychological romance and more on AnimeSparks.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Anime Categories Reviews Lists and Genres",
    description:
      "Explore anime articles by category including shounen sports psychological romance and more on AnimeSparks.",
    url: "/categories",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Categories Reviews Lists and Genres",
    description:
      "Explore anime articles by category including shounen sports psychological romance and more on AnimeSparks.",
    images: [defaultOgImage],
  },
};

type Category = {
  _id: string;
  title: string;
  slug: string;
  postCount?: number;
};

const formatCount = (count?: number) => {
  if (!count) return "No posts";
  return count === 1 ? "1 post" : `${count} posts`;
};

export default async function CategoriesPage() {
  const categories: Category[] = await client.fetch(categoriesWithCountsQuery);

  if (!categories?.length) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <AdSlot variant="full" className="mb-10" />
          <p className="text-sm font-medium text-gray-600">
            No categories yet.
          </p>
          <AdSlot variant="full" className="mt-10" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-linear-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/anime-poster.jpg')",
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              Browse Themes
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Categories
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Editorial arcs, character studies, and story analysis.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <AdSlot variant="full" className="mb-10" />

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-red-600" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              All Categories
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden rounded-sm border-2 border-gray-200 bg-white p-6 transition-all hover:border-red-600 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Category
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {formatCount(category.postCount)}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black leading-tight text-gray-900 transition-colors group-hover:text-red-600">
                  {category.title}
                </h3>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors group-hover:text-red-600">
                  View Articles
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot variant="full" className="mt-10" />
      </div>
    </main>
  );
}
