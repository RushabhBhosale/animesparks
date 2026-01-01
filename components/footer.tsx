// components/footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-2 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/home"
              className="font-semibold text-neutral-900 hover:text-neutral-700"
            >
              AnimeSparks
            </Link>
            <span>© {new Date().getFullYear()}</span>
            <span className="inline">·</span>
            <span className="inline">
              Powered by{" "}
              <Link
                href="https://www.rushabh.in/home"
                className="underline-offset-2 hover:underline"
              >
                Rushabh Bhosale
              </Link>
            </span>
          </div>

          {/* Right */}
          <nav className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-neutral-900" href="/blogs">
              Blogs
            </Link>
            <Link className="hover:text-neutral-900" href="/categories">
              Categories
            </Link>
            <Link className="hover:text-neutral-900" href="/about">
              About
            </Link>
            <Link className="hover:text-neutral-900" href="/privacy">
              Privacy
            </Link>
            <a className="hover:text-neutral-900" href="/rss.xml">
              RSS
            </a>
            <a className="hover:text-neutral-900" href="/sitemap.xml">
              Sitemap
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
