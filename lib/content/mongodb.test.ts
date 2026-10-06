import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/migration/mongodb.mjs", () => ({
  connectMongo: vi.fn(),
  getMigrationDatabaseName: vi.fn(() => "animesparks_staging"),
}));

import { connectMongo } from "@/lib/migration/mongodb.mjs";
import { rssBlogsQuery, sitemapEnglishBlogsQuery, sitemapSpanishBlogsQuery } from "@/sanity/blogQueries";
import { mongoFetch } from "./mongodb";

type ArticleFixture = {
  sanityId: string;
  sanityType: string;
  language: "en" | "es";
  publicationState: "published" | "draft";
  slug: string;
  translationOfSanityId?: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  sourceDocument: { title: string; body: Array<{ _key: string; _type: string; children: Array<{ _key: string; _type: string; text: string }> }> };
};

const fixtures: ArticleFixture[] = [
  ["one-piece-haki-guide", "One Piece Haki Guide", "en", "article-en-one"],
  ["vinland-saga-review", "Vinland Saga Review", "en", "article-en-two"],
  ["black-clover-magic-ranking", "Black Clover Magic Ranking", "en", "article-en-three"],
  ["guia-de-haki-de-one-piece", "Guía de Haki de One Piece", "es", "article-es-one"],
].map(([slug, title, language, sanityId]) => ({
  sanityId,
  sanityType: language === "es" ? "spanishPost" : "post",
  language: language as "en" | "es",
  publicationState: "published",
  slug,
  title,
  excerpt: `Excerpt for ${slug}`,
  publishedAt: "2025-01-01T00:00:00.000Z",
  sourceDocument: {
    title,
    body: [{ _key: `${sanityId}-block`, _type: "block", children: [{ _key: `${sanityId}-span`, _type: "span", text: `Body for ${slug}` }] }],
  },
}));
fixtures.find((doc) => doc.language === "es")!.translationOfSanityId = "article-en-one";
fixtures.push({
  ...fixtures[0],
  sanityId: "article-en-draft",
  slug: "unpublished-draft-article",
  title: "Draft must stay private",
  publicationState: "draft",
});

const englishQuery = '*[_type == "post" && "resolvedLocale": "en"]';
const spanishQuery = '*[_type == "spanishPost" && "resolvedLocale": "es"]';
const originalNextPhase = process.env.NEXT_PHASE;

function filterMatches(doc: ArticleFixture, filter: Record<string, any>) {
  if (filter.publicationState && doc.publicationState !== filter.publicationState) return false;
  if (filter.language && doc.language !== filter.language) return false;
  if (typeof filter.sanityId === "string" && doc.sanityId !== filter.sanityId) return false;
  if (typeof filter.translationOfSanityId === "string" && doc.translationOfSanityId !== filter.translationOfSanityId) return false;
  const slug = filter.slug;
  if (typeof slug === "string" && doc.slug !== slug) return false;
  if (slug && typeof slug === "object") {
    if (slug.$type === "string" && typeof doc.slug !== "string") return false;
    if (typeof slug.$eq === "string" && doc.slug !== slug.$eq) return false;
  }
  for (const key of ["sanityId", "translationOfSanityId"] as const) {
    const values = filter[key]?.$in;
    if (Array.isArray(values) && !values.includes(doc[key])) return false;
  }
  return true;
}

function mockCursor(filter: Record<string, any>) {
  const cursor: any = {
    sort: vi.fn(() => cursor),
    limit: vi.fn(() => cursor),
    toArray: vi.fn(async () => fixtures.filter((doc) => filterMatches(doc, filter))),
  };
  return cursor;
}

describe("MongoDB article adapter identity", () => {
  beforeEach(() => {
    process.env.NEXT_PHASE = "phase-production-build";
    delete (globalThis as any)[Symbol.for("animesparks.content.mongo.build-reference-cache")];
    delete (globalThis as any)[Symbol.for("animesparks.content.mongo.build-article-cache")];

    const articleCollection = {
      find: vi.fn((filter: Record<string, any>) => mockCursor(filter)),
      findOne: vi.fn(async (filter: Record<string, any>) => fixtures.find((doc) => filterMatches(doc, filter)) || null),
      aggregate: vi.fn(() => ({ toArray: vi.fn(async () => []) })),
    };
    const referenceCollection = { aggregate: vi.fn(() => ({ toArray: vi.fn(async () => []) })) };
    const db = {
      collection: (name: string) => name === "articles" ? articleCollection : referenceCollection,
    };
    vi.mocked(connectMongo).mockResolvedValue({ db: () => db } as never);
  });

  afterEach(() => {
    if (originalNextPhase === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = originalNextPhase;
    vi.clearAllMocks();
  });

  it("returns three distinct English articles and a Spanish article by the requested slug", async () => {
    const englishSlugs = fixtures.filter((doc) => doc.language === "en" && doc.publicationState === "published").map((doc) => doc.slug);
    const articles = await Promise.all(englishSlugs.map((slug) => mongoFetch<any>(englishQuery, { slug })));
    const spanishSlug = fixtures.find((doc) => doc.language === "es")!.slug;
    const spanishArticle = await mongoFetch<any>(spanishQuery, { slug: spanishSlug });

    expect(new Set(articles.map((article) => article._id)).size).toBe(3);
    articles.forEach((article, index) => {
      expect(article.slug).toBe(englishSlugs[index]);
      expect(article.title).toBe(fixtures[index].title);
      expect(article.metaTitle).toBe(fixtures[index].title);
      expect(article.body[0].children[0].text).toBe(`Body for ${englishSlugs[index]}`);
    });
    expect(spanishArticle._id).toBe("article-es-one");
    expect(spanishArticle.slug).toBe(spanishSlug);
    expect(spanishArticle.title).toBe("Guía de Haki de One Piece");
    expect(spanishArticle.body[0].children[0].text).toBe(`Body for ${spanishSlug}`);
  });

  it("returns no article for unknown slugs or unpublished drafts", async () => {
    await expect(mongoFetch(englishQuery, { slug: "unknown-article-slug" })).resolves.toBeNull();
    await expect(mongoFetch(englishQuery, { slug: "unpublished-draft-article" })).resolves.toBeNull();
  });

  it("keeps every published article available to sitemap and RSS query mappings", async () => {
    const sitemapEnglish = await mongoFetch<Array<{ slug: string; alternateSlug: string | null }>>(
      sitemapEnglishBlogsQuery,
    );
    const sitemapSpanish = await mongoFetch<Array<{ slug: string; alternateSlug: string | null }>>(
      sitemapSpanishBlogsQuery,
    );
    const rss = await mongoFetch<Array<{ slug: string; title: string }>>(
      rssBlogsQuery,
    );

    expect(sitemapEnglish.map((post) => post.slug).sort()).toEqual([
      "black-clover-magic-ranking", "one-piece-haki-guide", "vinland-saga-review",
    ]);
    expect(sitemapEnglish.find((post) => post.slug === "one-piece-haki-guide")?.alternateSlug).toBe("guia-de-haki-de-one-piece");
    expect(sitemapSpanish).toEqual([{ slug: "guia-de-haki-de-one-piece", alternateSlug: "one-piece-haki-guide", _updatedAt: undefined }]);
    expect(rss.map((post) => post.slug).sort()).toEqual([
      "black-clover-magic-ranking", "one-piece-haki-guide", "vinland-saga-review",
    ]);
  });
});
