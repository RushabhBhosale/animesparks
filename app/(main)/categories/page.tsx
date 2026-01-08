import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { categoriesWithCountsQuery } from "@/sanity/blogQueries";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { PageHero } from "@/components/page-hero";

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
      <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
        <PageHero
          eyebrow="Browse Themes"
          title="Categories"
          description="Editorial arcs, character studies, and story analysis."
          backgroundImage="/anime-poster.jpg"
        />
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
          <AdSlot variant="full" className="mb-10" />
          <p className="text-sm font-medium text-gray-400">
            No categories yet.
          </p>
          <AdSlot variant="full" className="mt-10" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Browse Themes"
        title="Categories"
        description="Editorial arcs, character studies, and story analysis."
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 space-y-10">
        <AdSlot variant="full" className="mb-6" />

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#ccff00]" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              All Categories
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden border border-[#1f1f1f] bg-[#0b0b0b] p-6 transition-all hover:border-[#ccff00]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f20d0d]">
                    Category
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {formatCount(category.postCount)}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black uppercase leading-tight text-white transition-colors group-hover:text-[#ccff00]">
                  {category.title}
                </h3>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 transition-colors group-hover:text-[#ccff00]">
                  View Articles
                  <span aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot variant="full" className="mt-6" />
      </div>
    </main>
  );
}
