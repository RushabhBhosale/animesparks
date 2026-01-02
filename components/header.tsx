// components/header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  Home,
  BookOpen,
  Layers,
  TrendingUp,
  Info,
  Menu,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
};

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: NavItem[] = useMemo(
    () => [
      { href: "/blogs", label: "Blogs" },
      { href: "/categories", label: "Categories" },
      { href: "/trending", label: "Trending" },
      { href: "/about", label: "About" },
    ],
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
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
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-gray-50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/home"
            className="text-xl font-bold tracking-tight no-underline! text-neutral-900 transition-colors hover:text-neutral-700"
          >
            AnimeSparks
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex no-underline! items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
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
            <Link
              className={clsx(
                "inline-flex no-underline! items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-colors",
                isActive("/home")
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
              href="/home"
            >
              <span>Home</span>
            </Link>

            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex no-underline! items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-colors",
                  isActive(href)
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
