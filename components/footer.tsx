import Link from "next/link";
import { Zap } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[#1f1f1f] bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="inline-flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#f20d0d] border-2 border-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Anime Editorials
                </p>
                <h2 className="text-3xl font-black uppercase tracking-tight md:text-4xl">
                  AnimeSparks
                </h2>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-gray-400">
              Deep dives, storytelling breakdowns, and shonen grit. Zero fluff -
              just focused anime analysis from writers who care about the craft.
            </p>
          </div>

          <div aria-labelledby="footer-navigation-heading">
            <h3
              id="footer-navigation-heading"
              className="mb-4 text-base font-bold uppercase tracking-widest text-[#ccff00]"
            >
              Navigation
            </h3>
            <ul className="space-y-2 text-sm uppercase text-gray-400">
              <li>
                <Link
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/blogs"
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/trending"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/categories"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          <div aria-labelledby="footer-links-heading">
            <h3
              id="footer-links-heading"
              className="mb-4 text-base font-bold uppercase tracking-widest text-[#ccff00]"
            >
              Feeds & Legal
            </h3>
            <ul className="space-y-2 text-sm uppercase text-gray-400">
              <li>
                <Link
                  prefetch={false}
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/rss.xml"
                >
                  RSS
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/sitemap"
                >
                  Sitemap
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/privacy"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  className="decoration-[#f20d0d] decoration-2 underline-offset-4 md:hover:text-white md:hover:underline"
                  href="/contact"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Ad (clean) */}
        <div className="mt-12 border-t border-[#1f1f1f] pt-8">
          <div className="flex justify-center border border-[#1f1f1f] bg-[#0b0b0b] p-3 sm:p-4">
            <AdSlot
              variant="full"
              slot="3916443984"
              insClassName="min-h-[200px] sm:min-h-[240px]"
              className="my-0 w-full"
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#1f1f1f] pt-8 text-xs uppercase tracking-[0.2em] text-gray-500 md:flex-row md:items-center md:justify-between">
          <span>© {year} AnimeSparks. All rights reserved.</span>
          <span className="text-gray-400">
            Built for anime lovers who crave depth.
          </span>
        </div>
      </div>
    </footer>
  );
}
