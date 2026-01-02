import Link from "next/link";
import { AdSlot } from "@/components/ads/ad-slot";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Daily Sparks is a personal anime blog by Rushabh Bhosale with reviews, lists, and character breakdowns.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About",
    description:
      "Daily Sparks is a personal anime blog by Rushabh Bhosale with reviews, lists, and character breakdowns.",
    url: "/about",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About",
    description:
      "Daily Sparks is a personal anime blog by Rushabh Bhosale with reviews, lists, and character breakdowns.",
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
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <section className="space-y-10 text-base leading-relaxed text-gray-700">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              What You Will Find Here
            </h2>
            <p className="mt-4 text-lg">
              I am Rushabh Bhosale, an anime nerd who has watched 250+ shows
              (and counting). AnimeSparks is my personal blog for reviews,
              rants, lists, and commentary - all focused on anime.
            </p>
            <p className="mt-3">
              Just one guy writing about what he watches - from shounen icons
              like Naruto and Bleach to hidden gems like Idaten Jump and
              Sakura-sou.
            </p>
          </div>

          <AdSlot variant="full" />

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Anime Reviews",
                body: "Honest, no-filter takes on series I have finished or dropped - including old-school, seasonal, and ongoing titles.",
              },
              {
                title: "Watchlists and Rankings",
                body: "What to watch next? I share recommendation lists, top 10s, genre picks, and mood-based suggestions.",
              },
              {
                title: "Character Breakdowns",
                body: "Deep dives into arcs, motivations, symbolism, and growth of iconic and underrated anime characters.",
              },
              {
                title: "No Spoiler? No Problem",
                body: "Each post is tagged clearly - spoiler-safe, spoiler-heavy, or first impressions.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-sm border border-gray-200 bg-white p-5"
              >
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-gray-600">{item.body}</p>
              </div>
            ))}
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

          <AdSlot variant="full" />

          <div className="rounded-sm border-2 border-red-600 bg-white p-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Want to Connect?
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Got a show suggestion or want to collaborate? Drop me a message. I
              read all my emails myself.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="mailto:hello@dailysparks.com"
                className="inline-flex items-center justify-center rounded-sm bg-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
              >
                Contact Me
              </a>
              <Link
                href="/blogs"
                className="inline-flex items-center justify-center rounded-sm border border-gray-300 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-gray-800 transition-colors hover:border-red-600 hover:text-red-600"
              >
                Read the Blog
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
