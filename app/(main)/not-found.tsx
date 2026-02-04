import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, Search } from "lucide-react";
import { bungeeOutline, splineSans } from "@/lib/font";

export default function NotFound() {
  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-[#050505] text-[#f0f0f0] ${splineSans.className}`}
    >
      {/* Atmospheric layers */}
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:120px_120px]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-anime-red/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-anime-cyan/15 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-24 md:px-8 md:pt-32">
        {/* Status badge */}
        <div className="mb-8 inline-flex items-center gap-2 border border-anime-line-strong bg-black/60 px-4 py-2 text-xs uppercase tracking-widest text-anime-muted shadow-[4px_4px_0px_0px_#f20d0d]">
          <span className="inline-flex size-2 rounded-full bg-anime-lime shadow-[0_0_0_3px_rgba(204,255,0,0.2)]" />
          Error Status
        </div>

        {/* Hero section */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <p
              className={`${bungeeOutline.className} text-7xl sm:text-8xl lg:text-9xl text-anime-lime drop-shadow-[0_8px_0_rgba(0,0,0,0.4)]`}
            >
              404
            </p>
            <div>
              <h1 className="text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Page Not Found
              </h1>
              <p className="mt-3 max-w-xl text-lg text-anime-muted">
                This page doesn't exist or has been moved. Use the options below
                to get back on track.
              </p>
            </div>
          </div>
        </div>

        {/* Primary navigation */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <Link
            href="/"
            className="group flex items-center justify-between gap-4 border border-anime-line-strong bg-anime-panel px-6 py-5 shadow-[6px_6px_0px_0px_#ccff00] transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-[8px_8px_0px_0px_#ccff00]"
          >
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-anime-muted">
                Primary Route
              </p>
              <p className="text-xl font-black uppercase">Home</p>
            </div>
            <ArrowLeft className="h-6 w-6 text-anime-lime transition-transform group-hover:-translate-x-1" />
          </Link>

          <Link
            href="/blogs"
            className="group flex items-center justify-between gap-4 border border-anime-line-strong bg-black px-6 py-5 shadow-[6px_6px_0px_0px_#00f3ff] transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-[8px_8px_0px_0px_#00f3ff]"
          >
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-anime-muted">
                Latest Content
              </p>
              <p className="text-xl font-black uppercase">Articles</p>
            </div>
            <ArrowRight className="h-6 w-6 text-anime-cyan transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Secondary options */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/search"
            className="group flex items-start gap-4 rounded-lg border border-anime-line-strong bg-[#0f0f0f] p-5 transition-colors md:hover:border-anime-cyan"
          >
            <Search className="h-5 w-5 shrink-0 text-anime-cyan" />
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider">
                Search
              </p>
              <p className="text-sm text-anime-muted">
                Find what you're looking for
              </p>
            </div>
          </Link>

          <Link
            href="/trending"
            className="group flex items-start gap-4 rounded-lg border border-anime-line-strong bg-[#0f0f0f] p-5 transition-colors md:hover:border-anime-lime"
          >
            <Compass className="h-5 w-5 shrink-0 text-anime-lime" />
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider">
                Trending
              </p>
              <p className="text-sm text-anime-muted">
                Popular content right now
              </p>
            </div>
          </Link>

          <Link
            href="/categories"
            className="group flex items-start gap-4 rounded-lg border border-anime-line-strong bg-[#0f0f0f] p-5 transition-colors md:hover:border-anime-red sm:col-span-2 lg:col-span-1"
          >
            <ArrowRight className="h-5 w-5 shrink-0 text-anime-red" />
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider">
                Categories
              </p>
              <p className="text-sm text-anime-muted">
                Browse all content types
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
