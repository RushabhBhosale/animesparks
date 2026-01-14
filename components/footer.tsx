import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[#1f1f1f] bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-4">
              <div className="size-12 rounded-full bg-[#f20d0d] flex items-center justify-center border-2 border-white shadow-[6px_6px_0px_0px_#ccff00]">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Anime Editorials
                </p>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                  AnimeSparks
                </h2>
              </div>
            </div>
            <p className="max-w-xl text-sm text-gray-400 leading-relaxed">
              Deep dives, storytelling breakdowns, and shonen grit. Zero fluff —
              just focused anime analysis from writers who care about the craft.
            </p>
          </div>

          <div aria-labelledby="footer-navigation-heading">
            <h3
              id="footer-navigation-heading"
              className="text-[#ccff00] font-bold uppercase mb-4 tracking-widest text-base"
            >
              Navigation
            </h3>
            <ul className="space-y-2 text-sm text-gray-400 uppercase">
              <li>
                <Link
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/blogs"
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/trending"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/categories"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/privacy"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div aria-labelledby="footer-links-heading">
            <h3
              id="footer-links-heading"
              className="text-[#ccff00] font-bold uppercase mb-4 tracking-widest text-base"
            >
              Feeds & Legal
            </h3>
            <ul className="space-y-2 text-sm text-gray-400 uppercase">
              <li>
                <Link
                  prefetch={false}
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/rss.xml"
                >
                  RSS
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/sitemap"
                >
                  Sitemap
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/privacy"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  className="md:hover:text-white md:hover:underline decoration-[#f20d0d] decoration-2 underline-offset-4"
                  href="/contact"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#1f1f1f] pt-8 md:flex-row md:items-center md:justify-between text-xs uppercase tracking-[0.2em] text-gray-500">
          <span>© {year} AnimeSparks. All rights reserved.</span>
          <span className="text-gray-400">
            Built for anime lovers who crave depth.
          </span>
        </div>
      </div>
    </footer>
  );
}
