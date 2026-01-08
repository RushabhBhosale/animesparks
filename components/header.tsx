// components/header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Menu, X, Zap } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
};

const navLinks: NavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/categories", label: "Categories" },
  { href: "/trending", label: "Trending" },
  { href: "/about", label: "About" },
];

const homeNavLinks: NavItem[] = [
  { href: "/blogs", label: "Stories" },
  { href: "/trending", label: "Reviews" },
  { href: "/categories", label: "Community" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = pathname === "/home";
  const links = isHome ? homeNavLinks : navLinks;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const mobileOverlay = (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 transition-opacity duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
          isHome ? "bg-black/70" : "bg-neutral-900/20"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={clsx(
          "fixed right-0 top-0 z-50 h-full w-72 transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          isHome
            ? "border-l border-[#242424] bg-[#0a0a0a] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            : "border-l border-neutral-200 bg-white shadow-xl"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div
          className={clsx(
            "flex items-center justify-between px-4 py-4",
            isHome ? "border-b border-[#1f1f1f]" : "border-b border-neutral-200"
          )}
        >
          <span
            className={clsx(
              "text-lg font-bold tracking-tight",
              isHome ? "text-white" : "text-neutral-900"
            )}
          >
            Menu
          </span>
          <button
            className={clsx(
              "rounded-md p-2 transition-colors",
              isHome
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            )}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex h-[calc(100%-73px)] flex-col px-4 py-6">
          <div className="flex flex-col gap-2">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] no-underline transition-colors",
                  isActive(href)
                    ? isHome
                      ? "bg-white/10 text-white"
                      : "bg-neutral-100 text-neutral-900"
                    : isHome
                      ? "text-white/70 hover:bg-white/5 hover:text-white"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span>{label}</span>
                {href === "/trending" && (
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      isHome ? "bg-[#ccff00]" : "bg-red-600"
                    )}
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );

  if (isHome) {
    return (
      <>
        <header className="pointer-events-none fixed top-6 left-0 right-0 z-50 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-start">
            <Link
              href="/home"
              className="pointer-events-auto bg-black/80 backdrop-blur-md border border-[#2a2a2a] p-2 rounded-full flex items-center gap-4 pr-6 shadow-[6px_6px_0px_0px_white] transition-transform hover:rotate-1 hover:scale-105"
              aria-label="AnimeSparks home"
            >
              <div className="size-10 bg-[#f20d0d] rounded-full flex items-center justify-center text-white border-2 border-white">
                <Zap className="h-6 w-6" />
              </div>
              <span className="font-black italic text-xl tracking-tighter uppercase text-white">
                Anime<span className="text-[#f20d0d]">Sparks</span>
              </span>
            </Link>

            <div className="pointer-events-auto hidden md:flex bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl gap-6 shadow-lg rotate-1 text-white">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="font-bold uppercase text-xs tracking-widest hover:text-[#ccff00] transition-colors"
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="pointer-events-auto">
              <button
                className="bg-[#ccff00] text-black size-12 rounded-full flex items-center justify-center font-black border-2 border-white hover:bg-white hover:scale-110 transition-all shadow-[0_0_20px_rgba(204,255,0,0.5)]"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </header>
        {mobileOverlay}
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-red-600/70 to-transparent"
        />

        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/home"
            className="group flex items-center gap-3 no-underline transition-colors hover:text-neutral-700"
            aria-label="AnimeSparks home"
          >
            <div className="flex-col leading-none sm:flex">
              <span className="text-sm font-black uppercase tracking-tight text-neutral-900">
                AnimeSparks
              </span>
              <span className="hidden md:block text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                Anime Reviews
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] no-underline transition-colors",
                  isActive(href)
                    ? "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <button
            className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {mobileOverlay}
    </>
  );
}
