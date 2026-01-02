// components/header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import Image from "next/image";

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
            {navLinks.map(({ href, label }) => (
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

      <div
        className={clsx(
          "fixed inset-0 z-40 bg-neutral-900/20 transition-opacity duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={clsx(
          "fixed right-0 top-0 z-50 h-full w-72 border-l border-neutral-200 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            Menu
          </span>
          <button
            className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex h-[calc(100%-73px)] flex-col px-4 py-6">
          <div className="flex flex-col gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] no-underline transition-colors",
                  isActive(href)
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span>{label}</span>
                {href === "/trending" && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-red-600"
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
