// components/header.tsx
"use client";

import Link from "next/link";
import clsx from "clsx";
import { Menu, Search, X, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

type NavItem = { href: string; label: string };
type SearchResult = {
  _id: string;
  title: string;
  slug: string;
  typeLabel?: string;
  kind: string;
  metaDescription?: string;
};

const navLinks: NavItem[] = [
  { href: "/blogs", label: "Blogs" },
  { href: "/categories", label: "Categories" },
  { href: "/trending", label: "Trending" },
];

const normalizeForHighlight = (s: string) => s.trim().toLowerCase();

function Highlight({ text, query }: { text: string; query: string }) {
  const q = normalizeForHighlight(query);
  if (!q) return <>{text}</>;
  const t = text;
  const idx = t.toLowerCase().indexOf(q);
  if (idx < 0) return <>{text}</>;
  const before = t.slice(0, idx);
  const match = t.slice(idx, idx + q.length);
  const after = t.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="bg-[#ccff00]/20 text-[#ccff00] font-medium">
        {match}
      </mark>
      {after}
    </>
  );
}

export default function Header() {
  const currentPath = usePathname() || "/";
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const blurTimeout = useRef<NodeJS.Timeout | null>(null);

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/" || currentPath === "/home";
    return (
      currentPath === href ||
      currentPath.startsWith(`${href}?`) ||
      currentPath.startsWith(`${href}/`)
    );
  };

  const q = searchTerm.trim();
  const dropdownItems = useMemo(() => (results || []).slice(0, 7), [results]);

  const shouldShowDropdown = useMemo(() => {
    return (
      isFocused && q.length >= 2 && (isLoading || dropdownItems.length >= 0)
    );
  }, [isFocused, q.length, isLoading, dropdownItems.length]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    const handler = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [q]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  const closeDropdown = () => {
    setIsFocused(false);
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => closeDropdown(), 120);
  };

  const goToSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    closeDropdown();
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeDropdown();
      event.currentTarget.blur();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      goToSearch(searchTerm);
    }
  };

  const stopBlur = (e: MouseEvent) => {
    e.preventDefault();
  };

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 text-lg font-bold tracking-tight text-white no-underline transition-transform md:hover:scale-105"
            aria-label="AnimeSparks Home"
          >
            <div className="size-8 rounded-full bg-[#f20d0d] flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_0px_#ccff00]">
              <Zap className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              AnimeSparks
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "text-sm font-semibold no-underline transition-colors",
                    active ? "text-white" : "text-white/70 md:hover:text-white"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative">
                    {label}
                    {active && (
                      <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-[#ccff00]" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Search (unchanged) */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div
              className={clsx(
                "relative flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-200",
                isFocused
                  ? "border-[#ccff00]/50 bg-white/5 shadow-lg shadow-[#ccff00]/10"
                  : "border-white/10 bg-white/[0.03] md:hover:border-white/20 md:hover:bg-white/5"
              )}
            >
              <Search className="h-4 w-4 text-white/40 flex-shrink-0" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Search anime or kdrama"
                className="bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none w-full"
                aria-label="Search articles"
                autoComplete="off"
                suppressHydrationWarning
              />
              {q.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setResults([]);
                  }}
                  className="rounded-full p-1 text-white/50 md:hover:text-white md:hover:bg-white/10 transition-colors flex-shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {shouldShowDropdown && (
              <div
                onMouseDown={stopBlur}
                className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/98 backdrop-blur-xl shadow-2xl shadow-black/40"
              >
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 bg-white/[0.02]">
                  {isLoading && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Searching...
                    </span>
                  )}
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {dropdownItems.length > 0 ? (
                    dropdownItems.map((item) => (
                      <Link
                        key={item._id}
                        href={`/${item.kind}/${item.slug}`}
                        onClick={() => closeDropdown()}
                        className="group block border-b border-white/5 px-4 py-3 transition-colors md:hover:bg-white/5 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-white md:group-hover:text-[#ccff00] transition-colors line-clamp-1">
                              <Highlight text={item.title} query={q} />
                            </h4>
                            {item.metaDescription && (
                              <p className="mt-1 text-xs text-white/50 line-clamp-2">
                                {item.metaDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-white/50">
                        No quick matches. Press{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs">
                          Enter
                        </kbd>{" "}
                        to search.
                      </p>
                    </div>
                  )}
                </div>

                {q.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => goToSearch(q)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#ccff00] md:hover:bg-[#ccff00]/5 transition-colors border-t border-white/10 bg-white/[0.02]"
                  >
                    <span>View all results for "{q}"</span>
                    <span className="text-white/40">→</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile: search icon -> /search, menu */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="inline-flex items-center justify-center rounded-lg p-2.5 text-white transition-colors md:hover:bg-white/10 border border-white/10"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex items-center rounded-lg p-2.5 text-white transition-colors md:hover:bg-white/10 border border-white/10"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (fixed z-index so it never goes under header/content) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[400] md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          />
          <div className="absolute right-0 top-0 z-[110] h-full w-full max-w-sm bg-gradient-to-b from-[#0a0a0a] to-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-6 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-[#f20d0d] flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_0px_#ccff00]">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-base font-bold text-white">
                  AnimeSparks
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-white/70 md:hover:text-white md:hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2 p-6" aria-label="Mobile">
              {navLinks.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      "group flex items-center justify-between rounded-xl px-5 py-4 text-sm font-semibold uppercase tracking-widest no-underline transition-all duration-200",
                      active
                        ? "text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/20 shadow-lg shadow-[#ccff00]/5"
                        : "text-white/75 md:hover:bg-white/5 md:hover:text-white border border-transparent"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                    <span
                      className={clsx(
                        "transition-transform duration-200",
                        active
                          ? "text-[#ccff00]"
                          : "text-white/40 md:group-hover:translate-x-1"
                      )}
                    >
                      →
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
