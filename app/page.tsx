// app/page.tsx
import Link from "next/link";

type PostCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
};

const categories = [
  { label: "Dark Shonen", href: "/category/dark-shonen" },
  { label: "Shonen", href: "/category/shonen" },
  { label: "Seinen", href: "/category/seinen" },
  { label: "Character Study", href: "/category/character-study" },
  { label: "Anime Analysis", href: "/category/anime-analysis" },
];

const latest: PostCard[] = [
  {
    slug: "black-clover-season-2-is-official-and-the-story-is-about-to-change",
    title: "Black Clover Season 2 Is Official and the Story Is About to Change",
    excerpt:
      "Season 2 is not just a return. It is a tonal shift that pushes the Clover Kingdom into its most intense era yet.",
    category: "Shonen",
    publishedAt: "Dec 29, 2025",
  },
  {
    slug: "why-dark-shonen-anime-are-taking-over-and-fans-want-more",
    title: "Why Dark Shonen Anime Are Taking Over (And Why Fans Want More)",
    excerpt:
      "Modern shonen is evolving into something heavier, sharper, and emotionally riskier. Here is what changed and why it works.",
    category: "Dark Shonen",
    publishedAt: "Dec 22, 2025",
  },
  {
    slug: "naruto-return-boruto-time-skip-revival",
    title: "Naruto’s Return and the Boruto Time Skip: A Necessary Revival",
    excerpt:
      "The time skip is more than hype. It is a structural reset that can fix pacing, stakes, and character focus.",
    category: "Anime Analysis",
    publishedAt: "Dec 20, 2025",
  },
  {
    slug: "why-anime-openings-matter-more-than-you-think",
    title: "Why Anime Openings Matter More Than You Think",
    excerpt:
      "Openings are not marketing. They are emotional contracts, foreshadowing devices, and mood setters packed into 90 seconds.",
    category: "Anime Analysis",
    publishedAt: "Dec 16, 2025",
  },
];

const recommended: PostCard[] = [
  {
    slug: "why-dark-shonen-anime-are-taking-over-and-fans-want-more",
    title: "Why Dark Shonen Anime Are Taking Over (And Why Fans Want More)",
    excerpt: "A focused breakdown of the genre shift and why fans crave it.",
    category: "Dark Shonen",
    publishedAt: "Dec 22, 2025",
  },
  {
    slug: "naruto-return-boruto-time-skip-revival",
    title: "Naruto’s Return and the Boruto Time Skip: A Necessary Revival",
    excerpt: "What a time skip can fix, and what it cannot.",
    category: "Anime Analysis",
    publishedAt: "Dec 20, 2025",
  },
  {
    slug: "why-anime-openings-matter-more-than-you-think",
    title: "Why Anime Openings Matter More Than You Think",
    excerpt: "Why the best openings become part of the story itself.",
    category: "Anime Analysis",
    publishedAt: "Dec 16, 2025",
  },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
      {children}
    </span>
  );
}

function PostCardView({ post }: { post: PostCard }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between gap-3">
        <Badge>{post.category}</Badge>
        <span className="text-xs text-white/50">{post.publishedAt}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white group-hover:text-white">
        {post.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70">
        {post.excerpt}
      </p>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
        Read →
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute top-32 right-[-120px] h-[420px] w-[420px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07080b]/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-black">
              AS
            </span>
            <span className="text-base font-bold tracking-tight">
              AnimeSparks
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link className="hover:text-white" href="/blog">
              Blog
            </Link>
            <Link className="hover:text-white" href="/categories">
              Categories
            </Link>
            <Link className="hover:text-white" href="/about">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/blog"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Read
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge>Modern Anime Storytelling</Badge>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Deep anime analysis for characters, arcs, and themes
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              AnimeSparks is an editorial anime blog focused on dark shonen,
              character psychology, and the evolving craft of modern anime.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/blog"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/90"
              >
                Read the latest
              </Link>
              <Link
                href="/category/dark-shonen"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Explore dark shonen
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] p-6">
            <div className="rounded-2xl border border-white/10 bg-[#0b0d13] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60">
                  Featured analysis
                </span>
                <Badge>Editor pick</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold leading-snug">
                Why modern shonen is getting darker
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Trauma, moral ambiguity, and quieter intensity are reshaping the
                genre. If you feel the shift, you are not imagining it.
              </p>
              <div className="mt-5">
                <Link
                  href="/blog/why-dark-shonen-anime-are-taking-over-and-fans-want-more"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Read the editorial →
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs font-semibold text-white/60">Focus</div>
                <div className="mt-2 text-sm font-bold text-white/90">
                  Dark shonen, arcs, psychology
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs font-semibold text-white/60">
                  Promise
                </div>
                <div className="mt-2 text-sm font-bold text-white/90">
                  Less noise, more insight
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Latest Sparks
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Fresh posts, written for humans, built for re-reads.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-white/80 hover:text-white"
          >
            View all →
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {latest.map((p) => (
            <PostCardView key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-2 md:p-10">
          <div>
            <Badge>Spotlight</Badge>
            <h2 className="mt-4 text-3xl font-black leading-tight">
              Black Clover Season 2 is official and the story is about to change
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              This comeback is not just hype. It is a tone shift that redefines
              Asta, raises the ceiling for stakes, and pushes the series into a
              harsher era.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/blog/black-clover-season-2-is-official-and-the-story-is-about-to-change"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/90"
              >
                Read the breakdown
              </Link>
              <Link
                href="/category/shonen"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                More shonen →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] p-6">
            <div className="text-xs font-semibold text-white/60">
              Why you will like AnimeSparks
            </div>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                Analysis-first posts with clear takes and clean structure
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                Strong internal linking so every post leads to another good read
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                Anime-specific focus that builds authority and consistent
                indexing
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Recommended
            </h2>
            <p className="mt-1 text-sm text-white/60">
              If you liked the vibe, continue here.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {recommended.map((p) => (
            <PostCardView key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-bold">AnimeSparks</div>
              <div className="mt-1 text-sm text-white/60">
                Editorial anime analysis for modern storytelling.
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              <Link className="hover:text-white" href="/about">
                About
              </Link>
              <Link className="hover:text-white" href="/blog">
                Blog
              </Link>
              <Link className="hover:text-white" href="/privacy">
                Privacy
              </Link>
            </div>
          </div>

          <div className="mt-8 text-xs text-white/40">
            © {new Date().getFullYear()} AnimeSparks. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
