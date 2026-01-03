import Link from "next/link";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";

export const metadata: Metadata = {
  title: "About AnimeSparks A Personal Anime Editorial Blog",
  description:
    "Learn about AnimeSparks a personal anime blog by Rushabh Bhosale focused on reviews lists character analysis and honest anime opinions.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About AnimeSparks A Personal Anime Editorial Blog",
    description:
      "Learn about AnimeSparks a personal anime blog by Rushabh Bhosale focused on reviews lists character analysis and honest anime opinions.",
    url: "/about",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About AnimeSparks A Personal Anime Editorial Blog",
    description:
      "Learn about AnimeSparks a personal anime blog by Rushabh Bhosale focused on reviews lists character analysis and honest anime opinions.",
    images: [defaultOgImage],
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden min-h-75 bg-linear-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/about-poster.jpg")',
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              About
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            AnimeSparks
          </h1>
          <p className="mt-4 max-w-2xl text-white/90 text-lg">
            A personal anime blog written by someone who actually watches anime.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <section className="space-y-10 text-base leading-relaxed text-gray-700">
          {/* Intro */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              Who Runs AnimeSparks?
            </h2>
            <p className="mt-4 text-lg">
              I’m <strong>Rushabh Bhosale</strong>, an anime fan who has watched
              over <strong>250 anime series</strong> across genres, eras, and
              formats — from long-running shounen to short psychological
              thrillers and overlooked gems.
            </p>
            <p className="mt-3">
              AnimeSparks exists because I wanted a space to write honest,
              experience-based thoughts about anime — not summaries, not trend
              chasing, and not algorithm bait.
            </p>
          </div>

          {/* How I judge */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              How I Judge Anime
            </h2>
            <p className="mt-4">
              I don’t use numeric scores or rankings. I focus on storytelling,
              character arcs, pacing, emotional impact, and whether a series
              delivers on the promise it makes to the viewer.
            </p>
            <p className="mt-3">
              If I drop a show, I say why. If I love something, I explain what
              worked — without pretending everything is a masterpiece.
            </p>
          </div>

          {/* What you’ll find */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              What You’ll Find Here
            </h2>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              <li>Anime reviews based on shows I’ve personally watched</li>
              <li>Recommendation lists and rankings by theme or mood</li>
              <li>First-episode and first-impression analysis</li>
              <li>Character breakdowns and story-focused essays</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Anime I Love
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2">
              {[
                "Hunter x Hunter (2011) - peak character arcs and Nen brilliance",
                "Kage no Jitsuryokusha ni Naritakute! - absurdity done right",
                "Idaten Jump - nostalgic mountain bike madness",
                "Sakura-sou no Pet na Kanojo - dreams, chaos and heart",
                "One Piece - the world-building GOAT",
                "Horimiya - wholesome high school feels",
                "Danshi Koukousei no Nichijou - peak deadpan comedy",
                "Death Note - the original mind game masterclass",
                "Naruto - the one that started it all",
                "Bleach - stylish, fast, unforgettable",
              ].map((title) => (
                <div
                  key={title}
                  className="rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
                >
                  {title}
                </div>
              ))}
            </div>
          </div>

          {/* Trust */}
          <div className="rounded-sm border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-xl font-black tracking-tight text-gray-900">
              Why Trust AnimeSparks?
            </h2>
            <p className="mt-3 text-sm text-gray-700">
              AnimeSparks is written entirely by one person. Every article is
              based on shows I’ve watched myself — not summaries, AI scripts, or
              copied opinions. The goal is simple: write for people who actually
              watch anime.
            </p>
          </div>

          {/* Transparency */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              Transparency
            </h2>
            <p className="mt-4">
              All opinions on this site are personal and independent. Some pages
              may display ads to support hosting and maintenance costs, but
              content decisions are never influenced by sponsorships.
            </p>
          </div>

          {/* Image credits */}
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Image credits: TMDB (The Movie Database) and official promotional
            materials. Images are used for editorial purposes only.
          </div>
        </section>
      </div>
    </main>
  );
}
