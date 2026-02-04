import type { Metadata } from "next";
import Link from "next/link";
import { groq } from "next-sanity";

import { SearchPageForm } from "@/components/search-page-form";
import { client } from "@/sanity/lib/client";
import { formatDate } from "@/utils/date";
import { runFuzzySearch, type SearchDoc } from "@/utils/search-index";
import { defaultOgImage, getBaseUrl, siteName } from "@/utils/seo";

export const dynamic = "force-dynamic";

type SearchParamsInput = Promise<{ q?: string | string[] }>;

type RawSearchDoc = {
  _id: string;
  title: string;
  metaDescription?: string;
  slug: string;
  typeLabel?: string;
  publishedAt?: string;
};

type RankedResult = {
  id: string;
  title: string;
  slug: string;
  typeLabel?: string;
  metaDescription?: string;
  publishedAt?: string;
  score: number;
};

const SEARCH_RESULT_LIMIT = 32;
const FETCH_POOL_LIMIT = 180;

const searchQuery = groq`
*[
  _type == "post" &&
  defined(slug.current) &&
  publishedAt <= now()
]
| order(publishedAt desc)[0...$limit]{
  _id,
  title,
  metaDescription,
  publishedAt,
  "slug": slug.current,
  "typeLabel": coalesce(categories[0]->title, "Article")
}
`;

async function getResults(query: string): Promise<RankedResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const fetched = await client.fetch<RawSearchDoc[]>(searchQuery, {
    limit: FETCH_POOL_LIMIT,
  });

  const docs: SearchDoc[] = (fetched ?? []).map((doc) => ({
    id: doc._id,
    title: doc.title,
    slug: doc.slug,
    metaDescription: doc.metaDescription,
    typeLabel: doc.typeLabel,
  }));

  const publishedAtById = new Map(
    (fetched ?? []).map((doc) => [doc._id, doc.publishedAt]),
  );

  return runFuzzySearch(q, docs, SEARCH_RESULT_LIMIT).map((result) => ({
    ...result,
    publishedAt: publishedAtById.get(result.id),
  }));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";

  const baseUrl = getBaseUrl();
  const title = query ? `Search results for "${query}"` : "Search the archive";
  const description = query
    ? `Live results for "${query}" across AnimeSparks analyses, dossiers, and breakdowns.`
    : "Search the AnimeSparks archive of analyses, lore breakdowns, and character studies.";
  const canonical = `${baseUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  const ogImage = new URL(defaultOgImage, baseUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const params = (await searchParams) ?? {};
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";
  const hasQuery = query.length >= 2;

  const results = hasQuery ? await getResults(query) : [];

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 md:pt-16">
        <div className="mb-6 flex flex-col gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.28em] text-white/50">
            Search Brief
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-tight">
            Scan the AnimeSparks archive
          </h1>
          <p className="text-sm text-white/60 max-w-3xl">
            Built for on-the-go readers: search dossiers, lore breakdowns, and
            character studies without opening the full navigation.
          </p>
        </div>

        <SearchPageForm key={query} initialQuery={query} />

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-white">
              {hasQuery ? "Live Results" : "Idle"}
            </span>
            <span className="text-white/50">
              {hasQuery
                ? `${results.length} file${results.length === 1 ? "" : "s"} matched`
                : "Type 2+ characters to run a scan"}
            </span>
            {hasQuery ? (
              <span className="ml-auto text-[10px] font-mono uppercase text-[#ccff00]">
                "{query}"
              </span>
            ) : null}
          </div>

          {hasQuery ? (
            results.length ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    prefetch={false}
                    href={`/blog/${result.slug}`}
                    className="group relative block overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 transition-all duration-200 md:hover:border-[#ccff00]/40 md:hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-3 sm:gap-3">
                      <div className="flex-1 space-y-2 sm:space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-white">
                            {result.typeLabel || "Article"}
                          </span>
                          {result.publishedAt ? (
                            <span className="text-white/50">
                              {formatDate(result.publishedAt)}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-lg sm:text-xl font-black leading-tight text-white md:group-hover:text-[#ccff00]">
                          {result.title}
                        </h2>

                        {result.metaDescription ? (
                          <p className="text-sm text-white/65 line-clamp-2">
                            {result.metaDescription}
                          </p>
                        ) : null}
                      </div>

                      <span className="hidden sm:inline text-white/40 transition-transform duration-200 md:group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/60 p-6 text-center">
                <p className="text-base font-semibold text-white">
                  No matches for "{query}"
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Try broader terms or check spelling. Categories and tags also
                  work.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/60 p-6 text-sm text-white/70">
              Start with an anime title, character, or theme. The scan runs
              automatically after 2 characters.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
