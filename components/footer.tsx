"use client";

// components/footer.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AtSign, Globe2, Play } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/home") {
    return (
      <footer className="bg-black border-t-2 border-[#1f1f1f] pt-16 pb-10 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-6xl md:text-7xl font-black text-[#0b1b2b] uppercase tracking-tighter leading-[0.8] select-none hover:text-[#f20d0d] transition-colors duration-500">
              Anime
              <br />
              Sparks
            </h2>
          </div>
          <div>
            <h5 className="text-[#f20d0d] font-bold uppercase mb-4 tracking-widest">
              Navigation
            </h5>
            <ul className="space-y-2 text-sm text-gray-400 font-mono uppercase">
              <li>
                <Link
                  className="hover:text-white hover:underline decoration-[#ccff00] decoration-2 underline-offset-4"
                  href="/home"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white hover:underline decoration-[#ccff00] decoration-2 underline-offset-4"
                  href="/blogs"
                >
                  Reviews
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white hover:underline decoration-[#ccff00] decoration-2 underline-offset-4"
                  href="/trending"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white hover:underline decoration-[#ccff00] decoration-2 underline-offset-4"
                  href="/blogs"
                >
                  Videos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-[#f20d0d] font-bold uppercase mb-4 tracking-widest">
              Connect
            </h5>
            <div className="flex justify-center md:justify-start gap-4">
              <a
                className="bg-[#0f0f0f] p-2 rounded hover:bg-white hover:text-black transition-colors"
                href="/home"
              >
                <Globe2 className="h-5 w-5" />
              </a>
              <a
                className="bg-[#0f0f0f] p-2 rounded hover:bg-white hover:text-black transition-colors"
                href="/blogs"
              >
                <Play className="h-5 w-5" />
              </a>
              <a
                className="bg-[#0f0f0f] p-2 rounded hover:bg-white hover:text-black transition-colors"
                href="/about"
              >
                <AtSign className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 text-center text-gray-600 text-xs uppercase tracking-widest">
          © {new Date().getFullYear()} AnimeSparks Inc. All rights reserved. Do
          not copy.
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-neutral-200 bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand Section */}
          <div className="space-y-3">
            <Link
              href="/home"
              className="inline-block text-xl font-black uppercase tracking-tight text-neutral-900 transition-colors hover:text-neutral-700"
            >
              AnimeSparks
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              Your destination for thoughtful anime reviews, curated lists, and
              deep character analysis. No hype, just honest takes from fans who
              care about the story.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/advertise"
                className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Advertise with us →
              </Link>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="grid flex-1 grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Explore */}
            <div className="space-y-4 min-w-[140px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Explore
              </h3>
              <nav className="flex flex-col gap-3">
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/home"
                >
                  Home
                </Link>
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/blogs"
                >
                  All Blogs
                </Link>
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/my-anime-list"
                >
                  My Anime List
                </Link>
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/categories"
                >
                  Categories
                </Link>
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/trending"
                >
                  Trending
                </Link>
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-4 min-w-[140px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Company
              </h3>
              <nav className="flex flex-col gap-3">
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/about"
                >
                  About
                </Link>
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/advertise"
                >
                  Advertise
                </Link>
                <Link
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/privacy"
                >
                  Privacy
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-4 min-w-[140px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Resources
              </h3>
              <nav className="flex flex-col gap-3">
                <a
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RSS Feed
                </a>
                <a
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sitemap
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-xs text-neutral-500 sm:flex-row sm:items-center sm:gap-4">
            <span>
              © {new Date().getFullYear()} AnimeSparks. All rights reserved.
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Made with care for the anime community</span>
          </div>
          <Link
            href="https://www.rushabh.in/home"
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            Created by Rushabh Bhosale
          </Link>
        </div>
      </div>
    </footer>
  );
}
