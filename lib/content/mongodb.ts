import "server-only";
import { connectMongo, getMigrationDatabaseName } from "@/lib/migration/mongodb.mjs";
import { getR2PublicBaseUrl } from "./provider";
import { resolveR2AssetUrl, resolveSpanishFallback } from "./semantics";
import { timeStaticArticleStage, timeStaticArticleStageSync } from "./static-article-diagnostic";

type Doc = Record<string, any>;
const PUBLIC = { publicationState: "published" };
const CARD_PROJECTION = {
  sanityId: 1, sanityType: 1, language: 1, slug: 1, title: 1, excerpt: 1,
  metaTitle: 1, metaDescription: 1, animeName: 1, articleType: 1, tags: 1,
  mainImage: 1, publishedAt: 1, updatedAt: 1, sourceCreatedAt: 1,
  sourceUpdatedAt: 1, viewCount: 1, authorSanityId: 1,
  categorySanityIds: 1, translationOfSanityId: 1,
};
type ReferenceData = {
  categories: Map<string, Doc>;
  authors: Map<string, Doc>;
  translationsByOriginalId: Map<string, Doc>;
};
const BUILD_REFERENCE_CACHE = Symbol.for("animesparks.content.mongo.build-reference-cache");
const BUILD_ARTICLE_CACHE = Symbol.for("animesparks.content.mongo.build-article-cache");

async function database() {
  const client = await timeStaticArticleStage("mongodb.connection-acquisition", () => connectMongo());
  return client.db(getMigrationDatabaseName(process.env));
}

function portableTextText(value: any): string {
  if (Array.isArray(value)) return value.map(portableTextText).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
  if (typeof value.text === "string") return value.text;
  return Object.values(value).map(portableTextText).filter(Boolean).join(" ");
}
function assetUrl(asset: Doc | null | undefined) {
  if (!asset) return null;
  return resolveR2AssetUrl(asset, getR2PublicBaseUrl());
}

function filenameFromReference(reference: string) {
  let decoded = reference;
  try { decoded = decodeURIComponent(reference); } catch { /* Keep the stored reference for parsing. */ }
  return decoded.split("/").at(-1);
}

function assetFromReference(reference: string) {
  const filename = filenameFromReference(reference);
  const match = filename?.match(/^([a-f\d]{40})-([0-9]+)x([0-9]+)\.([^.]+)$/i);
  if (!filename || !match) return null;
  const [, sha1, width, height] = match;
  const asset = { sanityId: `image-${sha1}`, r2Key: `sanity/${sha1}/${filename}`, width: Number(width), height: Number(height) };
  return { ...asset, _id: asset.sanityId, url: assetUrl(asset) };
}

function expandValue(value: any): any {
  if (Array.isArray(value)) return value.map(expandValue);
  if (!value || typeof value !== "object") return value;
  if (value._sanityAsset) {
    const result = { ...value };
    delete result._sanityAsset;
    result.asset = assetFromReference(value._sanityAsset);
    return result;
  }
  const out: Doc = {};
  for (const [key, child] of Object.entries(value)) out[key] = expandValue(child);
  return out;
}

function expandStoredImage(value: any): any {
  if (Array.isArray(value)) return value.map(expandStoredImage);
  if (!value || typeof value !== "object") return value;
  const result: Doc = {};
  for (const [key, child] of Object.entries(value)) result[key] = expandStoredImage(child);
  if (result.asset?.r2Key) result.asset = { ...result.asset, _id: result.asset.sanityId, url: assetUrl(result.asset) };
  return result;
}

async function queryReferenceData(db: any): Promise<ReferenceData> {
  const documents: Doc[] = await db.collection("categories").aggregate([
    { $project: { _id: 0, referenceKind: { $literal: "category" }, sanityId: 1, title: 1, slug: 1 } },
    { $unionWith: { coll: "authors", pipeline: [
      { $project: { _id: 0, referenceKind: { $literal: "author" }, sanityId: 1, name: 1, bio: 1, slug: 1, image: 1 } },
    ] } },
    { $unionWith: { coll: "articles", pipeline: [
      { $match: { language: "es", publicationState: "published", translationOfSanityId: { $type: "string" }, slug: { $type: "string" } } },
      { $lookup: { from: "articles", localField: "translationOfSanityId", foreignField: "sanityId", pipeline: [
        { $project: { _id: 0, publishedAt: 1 } },
      ], as: "originalPublication" } },
      { $set: { originalPublishedAt: { $first: "$originalPublication.publishedAt" } } },
      { $project: {
        _id: 0, referenceKind: { $literal: "translation" }, sanityId: 1, translationOfSanityId: 1,
        slug: 1, publishedAt: 1, originalPublishedAt: 1,
      } },
    ] } },
  ]).toArray();
  const categories = new Map<string, Doc>();
  const authors = new Map<string, Doc>();
  const translationsByOriginalId = new Map<string, Doc>();
  for (const doc of documents) {
    if (doc.referenceKind === "category") categories.set(doc.sanityId, doc);
    if (doc.referenceKind === "author") authors.set(doc.sanityId, doc);
    if (doc.referenceKind === "translation") {
      const publishedAt = doc.publishedAt || doc.originalPublishedAt;
      if (publishedAt && new Date(publishedAt).getTime() <= Date.now() && !translationsByOriginalId.has(doc.translationOfSanityId)) {
        translationsByOriginalId.set(doc.translationOfSanityId, doc);
      }
    }
  }
  return { categories, authors, translationsByOriginalId };
}

async function loadReferenceData(db: any): Promise<ReferenceData> {
  if (process.env.NEXT_PHASE !== "phase-production-build") return queryReferenceData(db);
  const dbName = getMigrationDatabaseName(process.env);
  const cacheStore = globalThis as any;
  const cache: Map<string, Promise<ReferenceData>> = cacheStore[BUILD_REFERENCE_CACHE] ??= new Map();
  if (!cache.has(dbName)) cache.set(dbName, queryReferenceData(db));
  try {
    return await cache.get(dbName)!;
  } catch (error) {
    cache.delete(dbName);
    throw error;
  }
}

async function projectCards(rawDocs: Doc[], db: any, spanish = false, cachedReferences?: ReferenceData) {
  if (!rawDocs.length) return [];
  const references = cachedReferences || await timeStaticArticleStage("mongodb.reference-cache", () => loadReferenceData(db));
  const missingSpanishFallbacks = spanish ? rawDocs.filter((doc) => {
    const source = doc.sourceDocument || {};
    return !doc._originalFallback && doc.translationOfSanityId &&
      (source.categories == null || source.author == null || source.tags == null || source.mainImage == null || source.publishedAt == null);
  }) : [];
  const originalDocs = missingSpanishFallbacks.length
    ? await db.collection("articles").find({
      sanityId: { $in: missingSpanishFallbacks.map((doc) => doc.translationOfSanityId) },
      ...PUBLIC,
    }, { projection: { sanityId: 1, categorySanityIds: 1, authorSanityId: 1, tags: 1, mainImage: 1, publishedAt: 1 } }).toArray()
    : [];
  const originalById = new Map<string, Doc>(originalDocs.map((doc: Doc) => [doc.sanityId, doc]));
  const effective = rawDocs.map((doc) => {
    if (!spanish) return doc;
    const source = doc.sourceDocument || {};
    const original = doc._originalFallback || originalById.get(doc.translationOfSanityId);
    if (!original) return doc;
    return {
      ...doc,
      categorySanityIds: source.categories == null ? original.categorySanityIds || [] : doc.categorySanityIds || [],
      authorSanityId: source.author == null ? original.authorSanityId : doc.authorSanityId,
      tags: source.tags == null ? original.tags : doc.tags,
      mainImage: source.mainImage == null ? original.mainImage : doc.mainImage,
      publishedAt: source.publishedAt == null ? original.publishedAt : doc.publishedAt,
    };
  });
  const missingExcerpts = effective.filter((doc) => !doc.metaDescription && !doc.excerpt && !doc.sourceDocument?.body);
  const bodyDocs = missingExcerpts.length
    ? await db.collection("articles").find({ sanityId: { $in: missingExcerpts.map((doc) => doc.sanityId) } }, { projection: { sanityId: 1, "sourceDocument.body": 1 } }).toArray()
    : [];
  const bodyById = new Map<string, any>(bodyDocs.map((doc: Doc) => [doc.sanityId, doc.sourceDocument?.body]));
  return effective.map((raw) => {
    const source = raw.sourceDocument || raw;
    const categories = (raw.categorySanityIds || []).map((id: string) => references.categories.get(id)).filter(Boolean)
      .map((category: Doc) => ({ _id: category.sanityId, title: category.title, slug: category.slug }));
    const authorDoc = references.authors.get(raw.authorSanityId);
    const authorSource = authorDoc?.sourceDocument || authorDoc;
    const excerpt = raw.metaDescription || raw.excerpt || portableTextText(source.body || bodyById.get(raw.sanityId));
    return {
      _id: raw.sanityId, title: raw.title, slug: raw.slug, publishedAt: raw.publishedAt,
      _createdAt: raw.sourceCreatedAt, _updatedAt: raw.sourceUpdatedAt,
      metaDescription: raw.metaDescription, excerpt, tags: raw.tags,
      mainImage: raw.mainImage ? expandStoredImage(raw.mainImage) : undefined,
      categories, author: authorDoc ? {
        name: authorDoc.name, bio: authorDoc.bio, slug: authorDoc.slug,
        image: expandStoredImage(authorSource?.image),
      } : undefined,
      viewCount: raw.viewCount || 0,
    };
  });
}

async function expandArticle(doc: Doc, db: any, spanish = false): Promise<Doc> {
  if (!doc) return doc;
  const original = spanish && doc.translationOfSanityId
    ? await db.collection("articles").findOne({ sanityId: doc.translationOfSanityId, ...PUBLIC }, { projection: { sourceDocument: 1, sanityId: 1, sanityType: 1, sourceCreatedAt: 1, sourceUpdatedAt: 1, slug: 1, authorSanityId: 1, categorySanityIds: 1, translationOfSanityId: 1, title: 1, excerpt: 1, metaDescription: 1, publishedAt: 1, updatedAt: 1, tags: 1, animeName: 1, articleType: 1, mainImage: 1 } })
    : null;
  const references = await timeStaticArticleStage("mongodb.reference-cache", () => loadReferenceData(db));
  const expandFullDoc = (raw: Doc) => expandValue(raw.sourceDocument || raw);
  const result = timeStaticArticleStageSync("portable-text-r2-expansion", () => expandFullDoc(doc));
  const id = doc.sanityId;
  result._id = id;
  result._type = doc.sanityType;
  result._createdAt = doc.sourceCreatedAt;
  result._updatedAt = doc.sourceUpdatedAt;
  if (doc.slug) result.slug = { _type: "slug", current: doc.slug };
  if (doc.authorSanityId) result.author = { _type: "reference", _ref: doc.authorSanityId };
  if (doc.categorySanityIds) result.categories = doc.categorySanityIds.map((sanityId: string) => ({ _type: "reference", _ref: sanityId }));
  if (spanish && doc.translationOfSanityId) result.originalPost = { _type: "reference", _ref: doc.translationOfSanityId };
  // Keep the migrated reference shape in stored documents; resolve fields only on reads.
  const categoryDocs = (doc.categorySanityIds || []).map((sanityId: string) => references.categories.get(sanityId)).filter(Boolean);
  if (categoryDocs.length) result.categories = categoryDocs.map((c: Doc) => ({ _id: c.sanityId, title: c.title, slug: c.slug }));
  else result.categories = [];
  const author = references.authors.get(doc.authorSanityId);
  if (author) result.author = { name: author.name, bio: author.bio, slug: author.slug, image: expandStoredImage(author.image) };
  if (!spanish) result.alternateSlug = references.translationsByOriginalId.get(doc.sanityId)?.slug || null;
  if (spanish && original) {
    const fallback = expandFullDoc(original);
    const fallbackAuthor = references.authors.get(original.authorSanityId);
    if (fallbackAuthor) fallback.author = { name: fallbackAuthor.name, bio: fallbackAuthor.bio, slug: fallbackAuthor.slug, image: expandStoredImage(fallbackAuthor.image) };
    fallback.categories = (original.categorySanityIds || []).map((id: string) => references.categories.get(id)).filter(Boolean).map((c: Doc) => ({ _id: c.sanityId, title: c.title, slug: c.slug }));
    Object.assign(result, resolveSpanishFallback(result, fallback, ["publishedAt", "animeName", "articleType", "tags", "sources", "updateHistory", "updatedAt", "mainImage", "categories", "author"]));
    result.alternateSlug = original.slug || null;
  }
  return result;
}

async function articles(db: any, language: "en" | "es", selector: Doc = {}, sort: Doc = { publishedAt: -1 }, limit?: number, projection: Doc = CARD_PROJECTION) {
  const filter: Doc = {
    ...PUBLIC,
    language,
    ...selector,
    slug: typeof selector.slug === "string"
      ? { $eq: selector.slug, $type: "string" }
      : { $type: "string" },
  };
  let docs: Doc[] = await db.collection("articles").find(filter, { projection }).sort(sort).toArray();
  if (language === "es") {
    const needFallbackDate = docs.filter((doc) => !doc.publishedAt && doc.translationOfSanityId);
    const originals = needFallbackDate.length
      ? await db.collection("articles").find({ sanityId: { $in: needFallbackDate.map((doc) => doc.translationOfSanityId) }, ...PUBLIC }, { projection: { sanityId: 1, publishedAt: 1 } }).toArray()
      : [];
    const originalDates = new Map(originals.map((doc: Doc) => [doc.sanityId, doc.publishedAt]));
    docs = docs.map((doc) => doc.publishedAt ? doc : { ...doc, publishedAt: originalDates.get(doc.translationOfSanityId) });
  }
  docs = docs.filter((doc) => doc.publishedAt && new Date(doc.publishedAt).getTime() <= Date.now());
  docs.sort((a, b) => {
    const av = a[Object.keys(sort)[0]], bv = b[Object.keys(sort)[0]];
    const direction = Object.values(sort)[0] as number;
    const value = (item: any) => typeof item === "number" ? item : new Date(item || 0).getTime();
    return (value(av) - value(bv)) * direction;
  });
  if (limit) docs = docs.slice(0, limit);
  return docs;
}

async function mongoFetchUncached<T>(query: string, params: Record<string, any> = {}): Promise<T> {
  const db = await database();
  const posts = db.collection("articles");
  const categories = db.collection("categories");
  const allEn = (projection: Doc = CARD_PROJECTION) => articles(db, "en", {}, { publishedAt: -1 }, undefined, projection);
  const allEs = (projection: Doc = { ...CARD_PROJECTION, "sourceDocument.categories": 1, "sourceDocument.author": 1, "sourceDocument.tags": 1, "sourceDocument.mainImage": 1, "sourceDocument.publishedAt": 1 }) => articles(db, "es", {}, { publishedAt: -1 }, undefined, projection);
  let result: any;
  if (query.includes('"resolvedLocale": "en"')) {
    const articleDocs = await timeStaticArticleStage("mongodb.article-query", () => articles(db, "en", { slug: params.slug }, {}, 1, { sourceDocument: 1, sanityId: 1, sanityType: 1, sourceCreatedAt: 1, sourceUpdatedAt: 1, slug: 1, authorSanityId: 1, categorySanityIds: 1, title: 1, excerpt: 1, metaTitle: 1, metaDescription: 1, publishedAt: 1, updatedAt: 1, tags: 1, sources: 1, updateHistory: 1, body: 1, mainImage: 1, animeName: 1, articleType: 1, faq: 1 }));
    const raw = articleDocs[0]; result = raw ? await expandArticle(raw, db) : null;
    if (result) { result._type = "post"; result.slug = raw.slug; result.metaTitle = result.metaTitle || result.title; result.metaDescription = result.metaDescription || result.excerpt || portableTextText(result.body); result.excerpt = result.excerpt || portableTextText(result.body); result.resolvedLocale = "en"; }
  } else if (query.includes('"resolvedLocale": "es"')) {
    const articleDocs = await timeStaticArticleStage("mongodb.article-query", () => articles(db, "es", { slug: params.slug }, {}, 1, { sourceDocument: 1, sanityId: 1, sanityType: 1, sourceCreatedAt: 1, sourceUpdatedAt: 1, slug: 1, authorSanityId: 1, categorySanityIds: 1, translationOfSanityId: 1, title: 1, excerpt: 1, metaTitle: 1, metaDescription: 1, publishedAt: 1, updatedAt: 1, tags: 1, sources: 1, updateHistory: 1, body: 1, mainImage: 1, animeName: 1, articleType: 1, faq: 1 }));
    const raw = articleDocs[0];
    result = raw ? await expandArticle(raw, db, true) : null;
    if (result) { result._type = "spanishPost"; result.slug = raw.slug; result.metaTitle = result.metaTitle || result.title; result.metaDescription = result.metaDescription || result.excerpt || portableTextText(result.body); result.excerpt = result.excerpt || portableTextText(result.body); result.resolvedLocale = "es"; }
  } else if (query.includes('"alternateSlug":') && query.includes("_updatedAt")) {
    const es = /^\s*\*\s*\[\s*_type\s*==\s*"spanishPost"/.test(query);
    const docs = await (es ? allEs() : allEn());
    const ids = es ? docs.map((d: Doc) => d.translationOfSanityId) : docs.map((d: Doc) => d.sanityId);
    const linked = await posts.find(es
      ? { sanityId: { $in: ids.filter(Boolean) } }
      : { translationOfSanityId: { $in: ids }, ...PUBLIC }, { projection: { sanityId: 1, slug: 1, translationOfSanityId: 1 } }).toArray();
    const alternate = new Map(linked.map((d: Doc) => [es ? d.sanityId : d.translationOfSanityId, d.slug]));
    result = docs.map((d: Doc) => ({ slug: d.slug, alternateSlug: alternate.get(es ? d.translationOfSanityId : d.sanityId) || null, _updatedAt: d.sourceUpdatedAt }));
  } else if (query.includes('"slug": slug.current') && !query.includes("title") && !query.includes("body")) {
    const es = query.includes("spanishPost");
    const docs = await (es ? allEs({ sanityId: 1, slug: 1, publishedAt: 1, translationOfSanityId: 1 }) : allEn({ sanityId: 1, slug: 1, publishedAt: 1 }));
    result = docs.map((doc: Doc) => ({ slug: doc.slug }));
  } else if (query.includes("$limit") && query.includes("typeLabel")) {
    const docs = (await allEn()).slice(0, Number(params.limit) || 100);
    const references = await timeStaticArticleStage("mongodb.reference-cache", () => loadReferenceData(db));
    const cards = await projectCards(docs, db, false, references);
    result = docs.map((d: Doc, index: number) => ({ ...cards[index], typeLabel: references.categories.get(d.categorySanityIds?.[0])?.title || "Article" }));
  } else if (query.includes("animeName in tags")) {
    result = await Promise.all((await allEn())
      .filter((d: Doc) => d.animeName && (d.tags || []).includes(d.animeName))
      .slice(0, 300)
      .map(async (d: Doc) => ({
        _id: d.sanityId,
        animeName: d.animeName,
        slug: d.slug,
        mainImage: d.mainImage ? expandStoredImage(d.mainImage) : d.mainImage,
      })));
  } else if (query.includes("$animeName") && query.includes("$currentId")) {
    const es = query.includes("spanishPost");
    const docs = await timeStaticArticleStage("mongodb.related-query", () => articles(db, es ? "es" : "en", { animeName: params.animeName, sanityId: { $ne: params.currentId } }, { publishedAt: -1 }, 5));
    result = await projectCards(docs, db, es);
  } else if (query.includes("$currentId")) {
    const es = query.includes("spanishPost");
    let docs: Doc[] = es
      ? await timeStaticArticleStage("mongodb.related-query", () => allEs())
      : await timeStaticArticleStage("mongodb.related-query", () => articles(db, "en", {
      sanityId: { $ne: params.currentId },
      $or: [
        ...(params.categoryIds?.length ? [{ categorySanityIds: { $in: params.categoryIds } }] : []),
        ...(params.tags?.length ? [{ tags: { $in: params.tags } }] : []),
      ],
    }));
    if (es) {
      const originals = await posts.find({ sanityId: { $in: docs.map((d: Doc) => d.translationOfSanityId).filter(Boolean) }, ...PUBLIC }, { projection: { sanityId: 1, categorySanityIds: 1, tags: 1 } }).toArray();
      const originalById = new Map<string, Doc>(originals.map((d: Doc) => [d.sanityId, d]));
      docs = docs.map((d: Doc) => {
      const source = d.sourceDocument || d;
      const original = originalById.get(d.translationOfSanityId);
      return {
        ...d,
        categorySanityIds: source.categories == null ? (original?.categorySanityIds || []) : (d.categorySanityIds || []),
        tags: source.tags == null ? (original?.tags || []) : (d.tags || []),
      };
    });
    }
    const candidates = docs.filter((d) => d.sanityId !== params.currentId).map((d) => {
      const categoryHits = (d.categorySanityIds || []).filter((id: string) => (params.categoryIds || []).includes(id)).length;
      const tagHits = (d.tags || []).filter((tag: string) => (params.tags || []).includes(tag)).length;
      return { d, score: categoryHits * 3 + tagHits };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || new Date(b.d.publishedAt).getTime() - new Date(a.d.publishedAt).getTime()).slice(0, 8);
    result = await projectCards(candidates.map((x) => x.d), db, es);
  } else if (query.includes("order(coalesce(viewCount")) {
    result = await projectCards(await articles(db, "en", {}, { viewCount: -1, publishedAt: -1 }, 10), db);
  } else if (query.includes('"slug": slug.current') && query.includes("publishedAt") && query.includes("mainImage")) {
    const es = query.includes("spanishPost");
    let docs: Doc[];
    if (query.includes("$slug")) {
      const category = await categories.findOne({ slug: params.slug }, { projection: { sanityId: 1 } });
      docs = category ? await articles(db, "en", { categorySanityIds: category.sanityId }) : [];
    } else if (query.includes("$tagValue")) {
      docs = await articles(db, "en", { tags: params.tagValue });
    } else {
      docs = es ? await allEs() : await allEn();
      if (query.includes("$slugs")) { const bySlug = new Map(docs.map((d: Doc) => [d.slug, d])); docs = (params.slugs || []).map((s: string) => bySlug.get(s)).filter(Boolean); }
    }
    result = await projectCards(docs, db, es);
  } else if (query.includes('"slug": slug.current') && query.includes("publishedAt") && query.includes("order(") && !query.includes("mainImage") && !query.includes("excerpt")) {
    const es = query.includes("spanishPost");
    result = (es ? await allEs() : await allEn()).map((doc: Doc) => ({
      _id: doc.sanityId, title: doc.title, slug: doc.slug, publishedAt: doc.publishedAt,
    }));
  } else if (query.includes('"postCount": count')) {
    const cats = await categories.find({}).sort({ title: 1 }).toArray();
    const docs = await allEn();
    const matchingByCategory = new Map<string, Doc[]>();
    for (const doc of docs) for (const id of doc.categorySanityIds || []) {
      const matching = matchingByCategory.get(id) || [];
      matching.push(doc); matchingByCategory.set(id, matching);
    }
    const coverDocs = query.includes('"cover":') ? cats.map((c: Doc) => matchingByCategory.get(c.sanityId)?.find((doc) => Boolean(doc.mainImage?.asset?.r2Key))).filter(Boolean) : [];
    const covers = await projectCards(coverDocs, db);
    let coverIndex = 0;
    result = cats.map((c: Doc) => {
      const matching = matchingByCategory.get(c.sanityId) || [];
      return { _id: c.sanityId, title: c.title, slug: c.slug, postCount: matching.length,
        ...(query.includes('"cover":') ? { cover: matching.find((doc) => Boolean(doc.mainImage?.asset?.r2Key)) ? covers[coverIndex++] : null } : {}) };
    });
  } else if (query.includes('_type == "category"') || query.includes("_type==\"category\"")) {
    const cats = await categories.find({}).sort({ title: 1 }).toArray(); result = cats.map((c: Doc) => ({ _id: c.sanityId, title: c.title, slug: c.slug, description: c.description }));
    if (query.includes("$slug")) result = result.find((c: Doc) => c.slug === params.slug) || null;
  } else if (query.includes("$slug")) {
    const c = await categories.findOne({ slug: params.slug }, { projection: { sanityId: 1 } }); const docs = c ? await articles(db, "en", { categorySanityIds: c.sanityId }) : []; result = await projectCards(docs, db);
  } else if (query.includes("$tagValue")) {
    result = await projectCards(await articles(db, "en", { tags: params.tagValue }), db);
  } else if (query.includes('"excerpt": coalesce(excerpt, pt::text(body))') && query.includes("_updatedAt")) {
    const docs = await allEn();
    const missing = docs.filter((d: Doc) => !d.excerpt && !d.metaDescription);
    const bodies = missing.length ? await posts.find({ sanityId: { $in: missing.map((d: Doc) => d.sanityId) } }, { projection: { sanityId: 1, sourceDocument: 1 } }).toArray() : [];
    const bodyById = new Map(bodies.map((d: Doc) => [d.sanityId, d.sourceDocument?.body]));
    result = docs.map((d: Doc) => ({
      _id: d.sanityId,
      title: d.title,
      slug: d.slug,
      publishedAt: d.publishedAt,
      _updatedAt: d.sourceUpdatedAt,
      excerpt: d.metaDescription || d.excerpt || portableTextText(bodyById.get(d.sanityId)),
    }));
  } else if (query.includes('"slug": slug.current') && query.includes('order(publishedAt desc)')) {
    const es = query.includes("spanishPost");
    const docs = query.includes("[0...18]")
      ? await articles(db, es ? "es" : "en", {}, { publishedAt: -1 }, 18)
      : es ? await allEs() : await allEn();
    result = await projectCards(docs, db, es);
  } else if (query.includes("homepageSettings")) {
    const h = await db.collection("homepageSettings").findOne({});
    const ids = (h?.editorsPicks || []).map((r: any) => r.sanityId).filter(Boolean);
    const pickedDocs = ids.length ? await posts.find({ sanityId: { $in: ids }, ...PUBLIC }, { projection: CARD_PROJECTION }).toArray() : [];
    const byId = new Map(pickedDocs.map((doc: Doc) => [doc.sanityId, doc]));
    const picks = h ? await projectCards(ids.map((id: string) => byId.get(id)).filter(Boolean), db) : [];
    result = h ? { editorsPicks: picks.filter(Boolean) } : null;
  } else if (query.includes("animeEntry")) {
    const entries = await db.collection("animeEntries").find({}).sort({ title: 1 }).toArray();
    result = await Promise.all(entries.map(async (entry: Doc) => {
      const source = entry.sourceDocument || entry;
      return { _id: entry.sanityId, title: entry.title, score: entry.score,
        coverImage: expandValue(source.coverImage), bannerImage: expandValue(source.bannerImage),
        genres: entry.genres, year: entry.year };
    }));
  } else if (query.includes("originalPost") || query.includes("spanishPost")) {
    result = await projectCards(await allEs(), db, true);
  } else if (query.includes("_type == \"post\"") || query.includes("*[_type==\"post\"")) {
    result = await projectCards(await allEn(), db);
  } else {
    throw new Error(`No MongoDB content repository mapping exists for query: ${query.slice(0, 90)}`);
  }
  return result as T;
}

export async function mongoFetchRelated<T>(args: {
  locale: "en" | "es";
  animeName?: string;
  currentId: string;
  categoryIds: string[];
  tags: string[];
}): Promise<{ franchise: T[]; related: T[] }> {
  const hasFranchise = Boolean(args.animeName);
  const hasTopical = Boolean(args.categoryIds.length || args.tags.length);
  if (!hasFranchise && !hasTopical) return { franchise: [], related: [] };

  const db = await database();
  const common: Doc = {
    ...PUBLIC,
    language: args.locale,
    sanityId: { $ne: args.currentId },
    slug: { $type: "string" },
  };
  const topicalClauses: Doc[] = [
    ...(args.categoryIds.length ? [{ categorySanityIds: { $in: args.categoryIds } }] : []),
    ...(args.tags.length ? [{ tags: { $in: args.tags } }] : []),
  ];
  const topicalMatch = args.locale === "es" ? common : { ...common, $or: topicalClauses };
  const franchiseMatch = { ...common, animeName: args.animeName };
  const sourceDocumentProjection = args.locale === "es" ? {
    "sourceDocument.categories": 1,
    "sourceDocument.author": 1,
    "sourceDocument.tags": 1,
    "sourceDocument.mainImage": 1,
    "sourceDocument.publishedAt": 1,
    _originalFallback: 1,
  } : {};
  const cardProjection = { ...CARD_PROJECTION, ...sourceDocumentProjection };
  const projectCardStage = { $project: { ...cardProjection, _relationshipKind: 1 } };
  const spanishFallbackStages = args.locale === "es" ? [
    { $lookup: { from: "articles", localField: "translationOfSanityId", foreignField: "sanityId", pipeline: [
      { $project: { _id: 0, categorySanityIds: 1, authorSanityId: 1, tags: 1, mainImage: 1, publishedAt: 1 } },
    ], as: "_originalFallback" } },
    { $set: { _originalFallback: { $first: "$_originalFallback" } } },
  ] : [];

  const initialKind = hasFranchise ? "franchise" : "related";
  const initialMatch = hasFranchise ? franchiseMatch : topicalMatch;
  const pipeline: Doc[] = [
    { $match: initialMatch },
    ...spanishFallbackStages,
    { $set: { _relationshipKind: initialKind } },
  ];
  const unionKind = hasFranchise ? "related" : "franchise";
  const unionMatch = hasFranchise ? topicalMatch : franchiseMatch;
  if (hasFranchise && hasTopical) {
    pipeline.push({ $unionWith: { coll: "articles", pipeline: [
      { $match: unionMatch },
      ...spanishFallbackStages,
      { $set: { _relationshipKind: unionKind } },
    ] } });
  }
  pipeline.push({ $facet: {
    franchise: [
      { $match: { _relationshipKind: "franchise" } },
      { $sort: { publishedAt: -1 } },
      projectCardStage,
    ],
    related: [
      { $match: { _relationshipKind: "related" } },
      { $sort: { publishedAt: -1 } },
      projectCardStage,
    ],
  } });

  const rows = await timeStaticArticleStage("mongodb.related-query", () => db.collection("articles").aggregate<Doc, Doc>(pipeline).toArray()) as Doc[];
  const groups = rows[0] || { franchise: [], related: [] };
  const now = Date.now();
  const isCurrentlyPublished = (doc: Doc) => {
    const time = new Date(doc.publishedAt || "").getTime();
    return Number.isFinite(time) && time <= now;
  };
  const franchiseDocs: Doc[] = hasFranchise
    ? groups.franchise.filter(isCurrentlyPublished).slice(0, 5)
    : [];
  const spanishRelated = (doc: Doc) => {
    if (args.locale !== "es") return doc;
    const original = doc._originalFallback;
    if (!original) return doc;
    const source = doc.sourceDocument || {};
    return {
      ...doc,
      categorySanityIds: source.categories == null ? original.categorySanityIds || [] : doc.categorySanityIds || [],
      tags: source.tags == null ? original.tags : doc.tags,
    };
  };
  const relatedDocs: Doc[] = hasTopical
    ? groups.related.filter(isCurrentlyPublished).map((candidate: Doc) => {
      const doc = spanishRelated(candidate);
      const categoryHits = (doc.categorySanityIds || []).filter((id: string) => args.categoryIds.includes(id)).length;
      const tagHits = (doc.tags || []).filter((tag: string) => args.tags.includes(tag)).length;
      return { doc, score: categoryHits * 3 + tagHits };
    }).filter((entry: { doc: Doc; score: number }) => entry.score > 0)
      .sort((a: { doc: Doc; score: number }, b: { doc: Doc; score: number }) => b.score - a.score || new Date(b.doc.publishedAt).getTime() - new Date(a.doc.publishedAt).getTime())
      .slice(0, 8).map((entry: { doc: Doc; score: number }) => entry.doc)
    : [];

  const selected = [...franchiseDocs, ...relatedDocs];
  const cards = await projectCards(selected, db, args.locale === "es") as T[];
  return {
    franchise: cards.slice(0, franchiseDocs.length),
    related: cards.slice(franchiseDocs.length),
  };
}

export function mongoFetch<T>(query: string, params: Record<string, any> = {}): Promise<T> {
  const isArticle = query.includes('"resolvedLocale": "en"') || query.includes('"resolvedLocale": "es"');
  const slug = params.slug;
  if (process.env.NEXT_PHASE !== "phase-production-build" || !isArticle || typeof slug !== "string") {
    return mongoFetchUncached<T>(query, params);
  }
  const dbName = getMigrationDatabaseName(process.env);
  const language = query.includes('"resolvedLocale": "es"') ? "es" : "en";
  const cacheStore = globalThis as any;
  const cache: Map<string, Promise<unknown>> = cacheStore[BUILD_ARTICLE_CACHE] ??= new Map();
  const key = JSON.stringify([dbName, "published", language, slug]);
  if (cache.has(key)) return cache.get(key) as Promise<T>;
  const pending = mongoFetchUncached<T>(query, params);
  cache.set(key, pending);
  pending.catch(() => cache.delete(key));
  return pending;
}
