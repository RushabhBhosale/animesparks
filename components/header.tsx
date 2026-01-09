// components/header.tsx
import Link from "next/link";
import { headers } from "next/headers";
import clsx from "clsx";
import { Menu, Zap, X } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
};

const navLinks: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/categories", label: "Categories" },
  { href: "/trending", label: "Trending" },
  { href: "/about", label: "About" },
];

export default async function Header() {
  const headerList = await headers();
  const currentPath =
    headerList.get("x-pathname") ||
    headerList.get("next-url") ||
    headerList.get("referer") ||
    "/";

  const links = navLinks;

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/" || currentPath === "/home";
    return (
      currentPath === href ||
      currentPath.startsWith(`${href}?`) ||
      currentPath.startsWith(`${href}/`)
    );
  };
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#1f1f1f] bg-[#050505]/90 backdrop-blur supports-backdrop-filter:bg-[#050505]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 relative">
          <Link
            href="/"
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
                prefetch={false}
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

          <details className="md:hidden">
            <summary
              className="flex items-center rounded-md p-2 text-white transition-colors hover:bg-white/10 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </summary>
            <div className="absolute right-4 top-16 z-50 w-72 border border-[#242424] bg-[#0a0a0a] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#1f1f1f]">
                <span className="text-lg font-bold tracking-tight text-white">
                  Menu
                </span>
                <X className="h-5 w-5 text-white/60" />
              </div>
              <nav className="flex flex-col gap-2 px-4 py-6">
                {links.map(({ href, label }) => (
                  <Link
                    prefetch={false}
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
              </nav>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
