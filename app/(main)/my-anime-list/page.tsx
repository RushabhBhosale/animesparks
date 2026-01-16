import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHero } from "@/components/page-hero";
import { client } from "@/sanity/lib/client";
import { animeListQuery } from "@/sanity/blogQueries";
import { defaultOgImage, siteName } from "@/utils/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "My Anime List | AnimeSparks",
  description:
    "A personal list of anime I have watched so far, with simple scores for each series.",
  alternates: {
    canonical: "/my-anime-list",
  },
  openGraph: {
    title: "My Anime List | AnimeSparks",
    description:
      "A personal list of anime I have watched so far, with simple scores for each series.",
    url: "/my-anime-list",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Anime List | AnimeSparks",
    description:
      "A personal list of anime I have watched so far, with simple scores for each series.",
    images: [defaultOgImage],
  },
};

type AnimeEntry = {
  _id: string;
  title: string;
  score: number;
  coverImage?: string | null;
  bannerImage?: string | null;
  genres?: string[] | null;
  year?: number | null;
};

export default async function MyAnimeListPage() {
  const animeList: AnimeEntry[] = await client.fetch(animeListQuery);
  const totalSeries = animeList.length;
  const averageScore = totalSeries
    ? animeList.reduce((sum, item) => sum + item.score, 0) / totalSeries
    : 0;

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="My Anime List"
        title="Watched Series"
        description="Every anime I have completed so far, with a quick score."
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Series List
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Scores are out of 10 and based on my personal watch history.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider text-gray-300">
            <span className="rounded-full border border-[#1f1f1f] bg-[#0b0b0b] px-3 py-2">
              {totalSeries} series
            </span>
            <span className="rounded-full border border-[#1f1f1f] bg-[#0b0b0b] px-3 py-2">
              Avg {totalSeries ? averageScore.toFixed(1) : "-"}
            </span>
            <Link
              href="/studio"
              className="rounded-full border border-[#1f1f1f] bg-[#0b0b0b] px-3 py-2 text-gray-200 transition-colors md:hover:border-[#ccff00] md:hover:text-[#ccff00]"
            >
              Add anime
            </Link>
          </div>
        </div>

        <AdSlot variant="full" className="my-8" />

        {animeList.length ? (
          <div className="rounded-sm border border-[#1f1f1f] bg-[#0b0b0b]">
            <ul className="divide-y divide-[#1f1f1f]">
              {animeList.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-4 px-4 py-3 sm:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm border border-[#1f1f1f] bg-black sm:h-20 sm:w-14">
                      {item.coverImage ? (
                        <Image
                          src={item.coverImage}
                          alt={`${item.title} cover`}
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized
                          priority={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      {(item.year || item.genres?.length) && (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.year ? `${item.year}` : null}
                          {item.year && item.genres?.length ? " - " : null}
                          {item.genres?.length
                            ? item.genres.slice(0, 3).join(", ")
                            : null}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#ccff00]">
                    {item.score}/10
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-sm border border-[#1f1f1f] bg-[#0b0b0b] p-6 text-sm text-gray-300">
            No anime entries yet. Add your list in the Sanity Studio.
          </div>
        )}

        <AdSlot variant="full" className="mt-10" />
      </div>
    </main>
  );
}
