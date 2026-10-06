import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildAssetManifest,
  readExport,
  transformDocument,
  transformDocuments,
  validateReferences,
} from "./transform.mjs";
import { findPublishedArticles } from "./mongodb.mjs";

const temporaryDirs = [];
async function tempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "animesparks-migration-"));
  temporaryDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(temporaryDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function imageFixture(buffer = Buffer.from("fixture-image-bytes")) {
  const sha1 = createHash("sha1").update(buffer).digest("hex");
  const filename = `${sha1}-20x10.png`;
  return {
    buffer,
    sha1,
    filename,
    sanityId: `image-${sha1}`,
    assets: {
      [`image-${sha1}`]: {
        sha1hash: sha1,
        originalFilename: "fixture.png",
        size: buffer.length,
        _createdAt: "2026-10-01T00:00:00Z",
        _updatedAt: "2026-10-01T00:00:00Z",
        _rev: "fixture-rev",
        metadata: { dimensions: { width: 20, height: 10, aspectRatio: 2 } },
      },
    },
  };
}

async function createAssetExport(fixture) {
  const source = await tempDir();
  await mkdir(path.join(source, "images"), { recursive: true });
  await writeFile(path.join(source, "images", fixture.filename), fixture.buffer);
  return source;
}

describe("Sanity migration transform", () => {
  it("transforms English posts while preserving source timestamps, SEO, and unknown fields", () => {
    const source = {
      _id: "post-a", _type: "post", _rev: "rev-a", _createdAt: "2025-01-01T00:00:00Z", _updatedAt: "2025-02-01T00:00:00Z",
      title: "A title", slug: { _type: "slug", current: "a-title" }, excerpt: "Summary", metaTitle: "Search title",
      metaDescription: "Search description", publishedAt: "2025-01-02T00:00:00Z", externalEditorialFlag: { checked: true },
    };
    const result = transformDocument(source, []);
    expect(result.document).toMatchObject({
      sanityId: "post-a", sanityType: "post", language: "en", publicationState: "published", slug: "a-title",
      sourceCreatedAt: source._createdAt, sourceUpdatedAt: source._updatedAt, sourceRevision: "rev-a",
      sourceUnknownFields: { externalEditorialFlag: { checked: true } },
      title: "A title", excerpt: "Summary", metaTitle: "Search title", metaDescription: "Search description",
    });
    expect(result.document.sourceDocument).toEqual(source);
  });

  it("preserves Spanish overrides and the English relation without copying inherited fields", () => {
    const source = {
      _id: "es-a", _type: "spanishPost", _rev: "r-es", title: "Título", slug: { current: "titulo" },
      originalPost: { _type: "reference", _ref: "en-a" }, excerpt: "Resumen", body: [],
    };
    const { document } = transformDocument(source, []);
    expect(document).toMatchObject({
      language: "es", translationOfSanityId: "en-a", title: "Título", excerpt: "Resumen",
    });
    expect(document).not.toHaveProperty("metaTitle");
    expect(document).not.toHaveProperty("metaDescription");
    expect(document.originalPost).toMatchObject({ sanityId: "en-a", _type: "reference" });
  });

  it("keeps a draft and published document with the same slug distinct", () => {
    const published = { _id: "post-1", _type: "post", title: "Live", slug: { current: "same-slug" } };
    const draft = { ...published, _id: "drafts.post-1", title: "Draft" };
    const output = transformDocuments([published, draft], []);
    expect(output.transformed.map((doc) => [doc.sanityId, doc.slug, doc.publicationState])).toEqual([
      ["post-1", "same-slug", "published"], ["drafts.post-1", "same-slug", "draft"],
    ]);
  });

  it("forces future public Mongo reads to filter out drafts", async () => {
    let query;
    const db = {
      collection: () => ({
        find: (filter) => {
          query = filter;
          return { toArray: async () => [] };
        },
      }),
    };
    await findPublishedArticles(db, { language: "en" });
    expect(query).toEqual({ $and: [{ language: "en" }, { publicationState: "published" }] });
  });

  it("preserves Portable Text structure and maps inline image nodes through the asset manifest", async () => {
    const fixture = imageFixture();
    const sourceDir = await createAssetExport(fixture);
    const exportDocs = [{
      _id: "post-pt", _type: "post", body: [
        { _key: "b1", _type: "block", style: "normal", markDefs: [{ _key: "l1", _type: "link", href: "https://example.com" }], children: [{ _key: "s1", _type: "span", marks: ["l1"], text: "Text" }] },
        { _key: "i1", _type: "image", _sanityAsset: `image@file://./images/${fixture.filename}`, alt: "Alt", crop: { left: 0.1 }, hotspot: { x: 0.5 } },
      ],
    }];
    const assets = await buildAssetManifest(sourceDir, fixture.assets, exportDocs);
    expect(assets.errors).toEqual([]);
    const transformed = transformDocument(exportDocs[0], assets.manifest).document.body;
    expect(transformed[0]).toEqual(exportDocs[0].body[0]);
    expect(transformed[1]).toMatchObject({
      _key: "i1", _type: "image", alt: "Alt", crop: { left: 0.1 }, hotspot: { x: 0.5 },
      sourceSanityAsset: `image@file://./images/${fixture.filename}`,
      asset: { sanityId: fixture.sanityId, sha1: fixture.sha1, r2Key: `sanity/${fixture.sha1}/${fixture.filename}` },
    });
  });

  it("reports a missing asset file explicitly", async () => {
    const fixture = imageFixture();
    const source = await tempDir();
    await mkdir(path.join(source, "images"), { recursive: true });
    const result = await buildAssetManifest(source, fixture.assets, []);
    expect(result.errors).toContainEqual(expect.objectContaining({ kind: "missing_asset_file", sanityId: fixture.sanityId }));
  });

  it("reports a hash mismatch explicitly", async () => {
    const fixture = imageFixture();
    const source = await createAssetExport(fixture);
    const corrupted = Buffer.from("different-bytes");
    await writeFile(path.join(source, "images", fixture.filename), corrupted);
    const result = await buildAssetManifest(source, fixture.assets, []);
    expect(result.errors).toContainEqual(expect.objectContaining({ kind: "asset_hash_mismatch", sanityId: fixture.sanityId }));
  });

  it("normalizes author, category, original-post, and homepage references to sanity IDs", () => {
    const docs = [
      { _id: "author-a", _type: "author" },
      { _id: "category-a", _type: "category" },
      { _id: "post-a", _type: "post", author: { _type: "reference", _ref: "author-a" }, categories: [{ _type: "reference", _ref: "category-a" }] },
      { _id: "es-a", _type: "spanishPost", originalPost: { _type: "reference", _ref: "post-a" } },
      { _id: "home-a", _type: "homepageSettings", editorsPicks: [{ _type: "reference", _ref: "post-a" }], moreBlogs: [{ _type: "reference", _ref: "es-a" }] },
    ];
    const transformed = transformDocuments(docs, []).transformed;
    expect(transformed.find((doc) => doc.sanityId === "post-a")).toMatchObject({ authorSanityId: "author-a", categorySanityIds: ["category-a"] });
    expect(transformed.find((doc) => doc.sanityId === "es-a").translationOfSanityId).toBe("post-a");
    expect(transformed.find((doc) => doc.sanityId === "home-a").editorsPicks[0].sanityId).toBe("post-a");
    expect(validateReferences(docs, transformed)).toEqual([]);
  });

  it("produces deterministic results on rerun", () => {
    const source = { _id: "stable-a", _type: "animeEntry", title: "Series", score: 8 };
    expect(transformDocument(source, [])).toEqual(transformDocument(source, []));
  });

  it("retains unrecognized Sanity fields in both sourceUnknownFields and sourceDocument", () => {
    const source = { _id: "unknown-a", _type: "animeEntry", title: "Series", newFutureField: [1, { nested: true }] };
    const { document } = transformDocument(source, []);
    expect(document.sourceUnknownFields).toEqual({ newFutureField: [1, { nested: true }] });
    expect(document.sourceDocument.newFutureField).toEqual(source.newFutureField);
  });

  it("fails on malformed NDJSON records with the offending line", async () => {
    const source = await tempDir();
    await writeFile(path.join(source, "data.ndjson"), '{"_id":"ok","_type":"post"}\n{broken}\n');
    await writeFile(path.join(source, "assets.json"), "{}");
    await expect(readExport(source)).rejects.toMatchObject({
      name: "MigrationError",
      details: { malformedRecords: [{ line: 2 }] },
    });
  });
});
