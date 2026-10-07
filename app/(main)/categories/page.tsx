import Link from "next/link";
import { client } from "@/lib/content/client";
import {
  categoriesWithCountsQuery,
  categoriesWithCoversQuery,
} from "@/sanity/blogQueries";
import { contentImageUrl } from "@/lib/content/image";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";

export const revalidate = 60;

const metaTitle = "Anime Categories & Topics";
const metaDescription =
  "Explore anime by category — reviews, opinions, lists, and news covering shonen, psychological anime, isekai, and more.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: { canonical: "/categories" },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/categories",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
    images: [defaultOgImage],
  },
};

type Category = {
  _id: string;
  title: string;
  slug: string;
  postCount?: number;
};

type CategoryWithCover = Category & {
  cover?: {
    title?: string;
    mainImage?: { asset?: { _ref?: string; url?: string }; alt?: string };
  } | null;
};

const formatCount = (count?: number) => {
  if (!count) return "No posts";
  return count === 1 ? "1 post" : `${count} posts`;
};

export default async function CategoriesPage() {
  let categories: CategoryWithCover[] = [];

  try {
    categories = await client.fetch<CategoryWithCover[]>(
      categoriesWithCoversQuery,
    );
  } catch {
    const basic = await client.fetch<Category[]>(categoriesWithCountsQuery);
    categories = (basic || []).map((c) => ({ ...c, cover: null }));
  }

  return (
    <main className="bg-anime-ink text-anime-text">
      <PageHero eyebrow="Find your next read" title="Editorial sections" description="Explore anime through its stories, characters, and ideas." />
      <div className="editorial-shell editorial-archive">
        <div className="series-grid">
          {categories.map((category, index) => {
            const imageUrl = category.cover?.mainImage ? contentImageUrl(category.cover.mainImage, { width: 900, quality: 75 }) : undefined;
            return (
              <Link key={category._id} href={`/categories/${category.slug}`} className="series-card">
                {imageUrl && <Image src={imageUrl} alt={category.cover?.title || category.title} fill sizes="(max-width: 540px) 90vw, (max-width: 768px) 45vw, 400px" className="object-cover" />}
                <span className="series-number">{String(index + 1).padStart(2, "0")}</span>
                <div><h2 className="text-2xl font-bold tracking-tight">{category.title}</h2><p>{formatCount(category.postCount)}<ArrowUpRight size={17} /></p></div>
              </Link>
            );
          })}
        </div>
        <Link href="/blogs" className="editorial-archive-link">Browse all articles <ArrowUpRight size={18} /></Link>
      </div>
    </main>
  );
}
