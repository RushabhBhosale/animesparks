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

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = navLinks;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMobileMenuOpen(false));
    return () => cancelAnimationFrame(frame);
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
          "fixed inset-0 z-40 transition-opacity duration-300 md:hidden bg-black/70",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={clsx(
          "fixed right-0 top-0 z-50 h-full w-72 transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          "border-l border-[#242424] bg-[#0a0a0a] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div
          className={clsx(
            "flex items-center justify-between px-4 py-4 border-b border-[#1f1f1f]"
          )}
        >
          <span
            className={clsx(
              "text-lg font-bold tracking-tight text-white"
            )}
          >
            Menu
          </span>
          <button
            className={clsx(
              "rounded-md p-2 transition-colors text-white/80 hover:bg-white/10 hover:text-white"
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
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#1f1f1f] bg-[#050505]/90 backdrop-blur supports-backdrop-filter:bg-[#050505]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/home"
            className="group flex items-center gap-3 no-underline transition-transform hover:translate-y-[-1px]"
            aria-label="AnimeSparks home"
          >
            <div className="size-10 bg-[#f20d0d] rounded-full flex items-center justify-center text-white border-2 border-white shadow-[4px_4px_0px_0px_#ccff00] group-hover:rotate-2 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="text-base font-black uppercase tracking-tight text-white block">
                AnimeSparks
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                Editorial Anime
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] no-underline transition-colors text-gray-300 hover:text-white",
                  isActive(href) && "text-white"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span>{label}</span>
                <span
                  aria-hidden="true"
                  className={clsx(
                    "absolute inset-x-2 -bottom-1 h-0.5 origin-left scale-x-0 transform bg-[#ccff00] transition-transform duration-200",
                    isActive(href) && "scale-x-100"
                  )}
                />
              </Link>
            ))}
          </nav>

          <button
            className="rounded-md p-2 text-white transition-colors hover:bg-white/10 md:hidden"
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
