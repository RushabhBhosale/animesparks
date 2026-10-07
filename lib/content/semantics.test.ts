import { describe, expect, it } from "vitest";
import { getContentSource } from "./provider";
import { resolveMongoImageUrl, resolveR2AssetUrl, resolveSpanishFallback, selectPublishedArticles } from "./semantics";

describe("content repository semantics", () => {
  it("defaults to Sanity and only accepts explicit server providers", () => {
    expect(getContentSource({} as unknown as NodeJS.ProcessEnv)).toBe("sanity");
    expect(getContentSource({ CONTENT_SOURCE: "mongodb" } as unknown as NodeJS.ProcessEnv)).toBe("mongodb");
    expect(() => getContentSource({ CONTENT_SOURCE: "unknown" } as unknown as NodeJS.ProcessEnv)).toThrow();
  });

  it("excludes drafts, missing slugs, and future articles; filters and sorts public articles", () => {
    const now = new Date("2026-10-05T00:00:00Z");
    const docs = [
      { publicationState: "published", slug: "old", publishedAt: "2026-10-01", tags: ["lore"], categorySanityIds: ["c1"] },
      { publicationState: "published", slug: "new", publishedAt: "2026-10-04", tags: ["lore"], categorySanityIds: ["c1"] },
      { publicationState: "draft", slug: "draft", publishedAt: "2026-10-04", tags: ["lore"] },
      { publicationState: "published", slug: "future", publishedAt: "2026-10-06", tags: ["lore"] },
      { publicationState: "published", publishedAt: "2026-10-04", tags: ["lore"] },
    ];
    expect(selectPublishedArticles(docs, { now }).map((doc) => doc.slug)).toEqual(["new", "old"]);
    expect(selectPublishedArticles(docs, { now, categoryId: "c1", tag: "lore", limit: 1 }).map((doc) => doc.slug)).toEqual(["new"]);
  });

  it("resolves Spanish fields only when overrides are absent", () => {
    expect(resolveSpanishFallback({ title: "Título", tags: null }, { title: "English", tags: ["tag"] }, ["title", "tags"]))
      .toEqual({ title: "Título", tags: ["tag"] });
  });

  it("builds deterministic public asset URLs and handles missing mappings", () => {
    expect(resolveR2AssetUrl({ r2Key: "sanity/hash/image.webp" }, "https://images.animesparks.blog/"))
      .toBe("https://images.animesparks.blog/sanity/hash/image.webp");
    expect(resolveR2AssetUrl(null, "https://images.animesparks.blog")).toBeNull();
    expect(resolveR2AssetUrl({ r2Key: "sanity/hash/an image.webp" }, "https://images.animesparks.blog"))
      .toBe("https://images.animesparks.blog/sanity/hash/an%20image.webp");
  });

  it("always resolves Mongo images through R2 and never falls back to Sanity CDN", () => {
    expect(resolveMongoImageUrl({ asset: {
      r2Key: "sanity/abc123/image.webp",
      url: "https://cdn.sanity.io/images/project/dataset/image-abc123-1200x675.webp",
    } }, "https://images.animesparks.blog"))
      .toBe("https://images.animesparks.blog/sanity/abc123/image.webp");

    expect(resolveMongoImageUrl({ asset: {
      url: "https://cdn.sanity.io/images/project/dataset/image-abc123-1200x675.webp",
    } }, "https://images.animesparks.blog")).toBeNull();
  });
});
