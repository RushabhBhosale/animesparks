import Link from "next/link";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/ad-slot";
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
              My Anime List
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Watched Series
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Every anime I have completed so far, with a quick score.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Series List
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Scores are out of 10 and based on my personal watch history.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <span className="rounded-sm border border-gray-200 bg-white px-3 py-2">
              {totalSeries} series
            </span>
            <span className="rounded-sm border border-gray-200 bg-white px-3 py-2">
              Avg {totalSeries ? averageScore.toFixed(1) : "-"}
            </span>
            <Link
              href="/studio"
              className="rounded-sm border border-gray-200 bg-white px-3 py-2 text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              Add anime
            </Link>
          </div>
        </div>

        <AdSlot variant="full" className="my-8" />

        {animeList.length ? (
          <div className="rounded-sm border border-gray-200 bg-white">
            <ul className="divide-y divide-gray-200">
              {animeList.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-4 px-4 py-3 sm:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-sm border border-gray-200 bg-gray-100 sm:h-20 sm:w-14">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={`${item.title} cover`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          width={56}
                          height={80}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      {(item.year || item.genres?.length) && (
                        <p className="mt-1 text-xs text-gray-600">
                          {item.year ? `${item.year}` : null}
                          {item.year && item.genres?.length ? " - " : null}
                          {item.genres?.length
                            ? item.genres.slice(0, 3).join(", ")
                            : null}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-gray-600">
                    {item.score}/10
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-sm border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No anime entries yet. Add your list in the Sanity Studio.
          </div>
        )}

        <AdSlot variant="full" className="mt-10" />
      </div>
    </main>
  );
}
