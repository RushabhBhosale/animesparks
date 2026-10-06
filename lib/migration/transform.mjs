import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export const EXPECTED_COUNTS = Object.freeze({
  post: 235,
  spanishPost: 13,
  animeEntry: 131,
  category: 6,
  author: 1,
  homepageSettings: 1,
  subscriber: 1,
});

export const IMPORTED_TYPES = Object.freeze([
  "post",
  "spanishPost",
  "animeEntry",
  "category",
  "author",
  "homepageSettings",
]);

const ARTICLE_FIELDS = new Set([
  "title", "slug", "excerpt", "animeName", "articleType", "metaTitle", "metaDescription", "author", "tags",
  "mainImage", "categories", "publishedAt", "updatedAt", "updateHistory", "body", "primaryKeyword",
  "secondaryKeywords", "internalLinks", "sources", "faq", "viewCount", "integrationCreatedAt", "seoTitle",
  "originalPost",
]);
const FIELD_SETS = {
  post: ARTICLE_FIELDS,
  spanishPost: new Set([
    "originalPost", "title", "slug", "excerpt", "metaTitle", "metaDescription", "author", "tags", "mainImage",
    "categories", "publishedAt", "updatedAt", "body", "faq", "viewCount",
  ]),
  animeEntry: new Set(["title", "score", "coverImage", "bannerImage", "genres", "year"]),
  category: new Set(["title", "slug", "description"]),
  author: new Set(["name", "slug", "image", "bio"]),
  homepageSettings: new Set(["title", "editorsPicks", "moreBlogs"]),
  subscriber: new Set(["email", "source", "status", "subscribedAt"]),
};
const SYSTEM_FIELDS = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt", "_system"]);

export class MigrationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "MigrationError";
    this.details = details;
  }
}

export function sha1Buffer(buffer) {
  return createHash("sha1").update(buffer).digest("hex");
}

export async function sha1File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha1");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export function mimeTypeForFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".avif": "image/avif", ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg",
    ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".bmp": "image/bmp",
    ".tif": "image/tiff", ".tiff": "image/tiff",
  };
  return types[ext] ?? "application/octet-stream";
}

export async function readExport(sourceDir) {
  const absoluteSource = path.resolve(sourceDir);
  const dataPath = path.join(absoluteSource, "data.ndjson");
  const assetsPath = path.join(absoluteSource, "assets.json");
  let dataText;
  let assetsText;
  try {
    [dataText, assetsText] = await Promise.all([readFile(dataPath, "utf8"), readFile(assetsPath, "utf8")]);
  } catch (error) {
    throw new MigrationError(`Export must contain readable data.ndjson and assets.json: ${error.message}`);
  }

  const documents = [];
  const malformedRecords = [];
  for (const [index, line] of dataText.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line);
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("record must be a JSON object");
      }
      documents.push(value);
    } catch (error) {
      malformedRecords.push({ line: index + 1, message: error.message });
    }
  }
  if (malformedRecords.length) {
    throw new MigrationError(`${malformedRecords.length} malformed data.ndjson record(s).`, { malformedRecords });
  }

  let assets;
  try {
    assets = JSON.parse(assetsText);
  } catch (error) {
    throw new MigrationError(`assets.json is malformed JSON: ${error.message}`);
  }
  if (!assets || typeof assets !== "object" || Array.isArray(assets)) {
    throw new MigrationError("assets.json must be an object keyed by Sanity asset ID.");
  }
  return { sourceDir: absoluteSource, documents, assets, dataText, assetsText };
}

function imageFilenameFromReference(reference) {
  if (typeof reference !== "string") return null;
  let decoded;
  try {
    decoded = decodeURIComponent(reference);
  } catch {
    decoded = reference;
  }
  const match = decoded.match(/^image@file:\/\/\.\/images\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function buildAssetManifest(sourceDir, assets, documents = []) {
  const absoluteSource = path.resolve(sourceDir);
  const imageDir = path.join(absoluteSource, "images");
  let filenames;
  try {
    filenames = await readdir(imageDir);
  } catch (error) {
    throw new MigrationError(`Unable to read export images directory: ${error.message}`);
  }
  const fileSet = new Set(filenames);
  const referencedFilenames = new Set();
  const assetRefs = [];
  const visit = (value, docId) => {
    if (Array.isArray(value)) {
      value.forEach((child) => visit(child, docId));
    } else if (value && typeof value === "object") {
      if ("_sanityAsset" in value) assetRefs.push({ docId, reference: value._sanityAsset });
      Object.values(value).forEach((child) => visit(child, docId));
    }
  };
  documents.forEach((doc) => visit(doc, doc._id));

  const errors = [];
  const warnings = [];
  const hashToAssetId = new Map();
  const manifest = [];
  const seenHashes = new Map();
  const seenKeys = new Map();

  for (const [sanityId, asset] of Object.entries(assets)) {
    if (!sanityId.startsWith("image-") || !asset || typeof asset !== "object") {
      errors.push({ kind: "invalid_asset_record", sanityId });
      continue;
    }
    const sha1 = asset.sha1hash;
    if (!/^[a-f0-9]{40}$/i.test(sha1 ?? "")) {
      errors.push({ kind: "invalid_sha1", sanityId, sha1: sha1 ?? null });
      continue;
    }
    if (seenHashes.has(sha1)) {
      errors.push({ kind: "duplicate_asset_hash", sanityId, conflictsWith: seenHashes.get(sha1), sha1 });
      continue;
    }
    seenHashes.set(sha1, sanityId);
    hashToAssetId.set(sha1, sanityId);

    const candidates = filenames.filter((filename) => filename.startsWith(`${sha1}-`));
    if (candidates.length !== 1) {
      errors.push({
        kind: candidates.length ? "conflicting_asset_files" : "missing_asset_file",
        sanityId,
        sha1,
        files: candidates,
      });
      continue;
    }
    const filename = candidates[0];
    const filePath = path.join(imageDir, filename);
    const [actualSha1, fileStat] = await Promise.all([sha1File(filePath), stat(filePath)]);
    if (actualSha1 !== sha1) {
      errors.push({ kind: "asset_hash_mismatch", sanityId, filename, expected: sha1, actual: actualSha1 });
      continue;
    }
    const dimensions = asset.metadata?.dimensions;
    const filenameDimensions = filename.match(/-([0-9]+)x([0-9]+)\.[^.]+$/);
    if (!filenameDimensions) {
      errors.push({ kind: "invalid_asset_filename_dimensions", sanityId, filename });
      continue;
    }
    if (dimensions?.width !== Number(filenameDimensions[1]) || dimensions?.height !== Number(filenameDimensions[2])) {
      errors.push({
        kind: "asset_dimension_mismatch",
        sanityId,
        filename,
        expected: { width: Number(filenameDimensions[1]), height: Number(filenameDimensions[2]) },
        actual: { width: dimensions?.width ?? null, height: dimensions?.height ?? null },
      });
      continue;
    }
    const name = `sanity/${sha1}/${filename}`;
    if (seenKeys.has(name)) {
      errors.push({ kind: "duplicate_r2_key", sanityId, conflictsWith: seenKeys.get(name), key: name });
      continue;
    }
    seenKeys.set(name, sanityId);
    manifest.push({
      sanityId,
      sha1,
      filename,
      originalFilename: asset.originalFilename ?? null,
      mimeType: mimeTypeForFilename(filename),
      byteSize: fileStat.size,
      declaredByteSize: asset.size ?? null,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      aspectRatio: dimensions?.aspectRatio ?? null,
      createdAt: asset._createdAt ?? null,
      updatedAt: asset._updatedAt ?? null,
      revision: asset._rev ?? null,
      sourceMetadata: structuredClone(asset),
      r2Key: name,
      localPath: filePath,
      referenced: false,
    });
  }

  const byFilename = new Map(manifest.map((item) => [item.filename, item]));
  for (const { docId, reference } of assetRefs) {
    const filename = imageFilenameFromReference(reference);
    if (!filename) {
      errors.push({ kind: "invalid_asset_reference", docId, reference });
      continue;
    }
    referencedFilenames.add(filename);
    const entry = byFilename.get(filename);
    if (!fileSet.has(filename) || !entry) {
      errors.push({ kind: "unresolved_asset_reference", docId, reference, filename });
      continue;
    }
    entry.referenced = true;
  }

  const manifestNames = new Set(manifest.map((item) => item.filename));
  for (const filename of filenames) {
    if (!manifestNames.has(filename)) warnings.push({ kind: "untracked_image_file", filename });
  }
  for (const entry of manifest) {
    if (entry.declaredByteSize !== null && entry.declaredByteSize !== entry.byteSize) {
      errors.push({ kind: "asset_size_mismatch", sanityId: entry.sanityId, filename: entry.filename, expected: entry.declaredByteSize, actual: entry.byteSize });
    }
  }

  return { manifest, errors, warnings, referenceCount: assetRefs.length, referencedFilenameCount: referencedFilenames.size };
}

function countByType(documents) {
  const counts = {};
  for (const doc of documents) counts[doc._type] = (counts[doc._type] ?? 0) + 1;
  return counts;
}

function collectReferences(value, out = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, out));
  } else if (value && typeof value === "object") {
    if (value._type === "reference" && typeof value._ref === "string") {
      out.push({ sanityId: value._ref, weak: value._weak === true });
    }
    Object.values(value).forEach((item) => collectReferences(item, out));
  }
  return out;
}

export function validateSourceDocuments(documents) {
  const errors = [];
  const counts = countByType(documents);
  const idMap = new Map();
  for (const [index, doc] of documents.entries()) {
    if (typeof doc._id !== "string" || !doc._id) {
      errors.push({ kind: "missing_document_id", record: index + 1 });
    } else if (idMap.has(doc._id)) {
      errors.push({ kind: "duplicate_document_id", sanityId: doc._id, firstRecord: idMap.get(doc._id), record: index + 1 });
    } else {
      idMap.set(doc._id, index + 1);
    }
    if (typeof doc._type !== "string" || !FIELD_SETS[doc._type]) {
      errors.push({ kind: "unsupported_document_type", sanityId: doc._id ?? null, sanityType: doc._type ?? null });
    }
  }
  for (const [sanityType, expected] of Object.entries(EXPECTED_COUNTS)) {
    if ((counts[sanityType] ?? 0) !== expected) {
      errors.push({ kind: "source_count_mismatch", sanityType, expected, actual: counts[sanityType] ?? 0 });
    }
  }
  const seenPublicSlugs = new Map();
  for (const doc of documents) {
    const draft = typeof doc._id === "string" && doc._id.startsWith("drafts.");
    if (doc._type === "spanishPost" && draft) errors.push({ kind: "unexpected_spanish_draft", sanityId: doc._id });
    if (doc._type === "post" || doc._type === "spanishPost") {
      const slug = doc.slug?.current;
      if (!slug) errors.push({ kind: "missing_article_slug", sanityId: doc._id });
      if (!draft && slug) {
        const language = doc._type === "spanishPost" ? "es" : "en";
        const key = `${language}\0${slug}`;
        if (seenPublicSlugs.has(key)) errors.push({ kind: "duplicate_published_slug", language, slug, conflictsWith: seenPublicSlugs.get(key), sanityId: doc._id });
        else seenPublicSlugs.set(key, doc._id);
      }
    }
  }
  const draftCount = documents.filter((doc) => doc._type === "post" && doc._id?.startsWith("drafts.")).length;
  if (draftCount !== 5) errors.push({ kind: "english_draft_count_mismatch", expected: 5, actual: draftCount });
  return { counts, errors, draftCount, sourceDocumentCount: documents.length };
}

function transformImage(value, assetByFilename, context) {
  if (Array.isArray(value)) return value.map((item) => transformImage(item, assetByFilename, context));
  if (!value || typeof value !== "object") return value;
  const mapped = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "_sanityAsset") continue;
    if (key === "_ref" && value._type === "reference") continue;
    mapped[key] = transformImage(child, assetByFilename, context);
  }
  if (value._type === "reference" && typeof value._ref === "string") {
    mapped.sanityId = value._ref;
    mapped.weak = value._weak === true;
  }
  if ("_sanityAsset" in value) {
    const filename = imageFilenameFromReference(value._sanityAsset);
    const asset = filename ? assetByFilename.get(filename) : null;
    if (!asset) {
      context.errors.push({ kind: "unmapped_image_reference", sanityId: context.sanityId, reference: value._sanityAsset });
      return { ...mapped, sourceSanityAsset: value._sanityAsset, asset: null };
    }
    mapped.sourceSanityAsset = value._sanityAsset;
    mapped.asset = {
      sanityId: asset.sanityId,
      sha1: asset.sha1,
      r2Key: asset.r2Key,
      publicUrl: null,
    };
  }
  return mapped;
}

export function transformDocument(doc, assetManifest) {
  const publicationState = doc._id.startsWith("drafts.") ? "draft" : "published";
  const isArticle = doc._type === "post" || doc._type === "spanishPost";
  const language = doc._type === "spanishPost" ? "es" : isArticle ? "en" : undefined;
  const errors = [];
  const assetByFilename = new Map(assetManifest.map((asset) => [asset.filename, asset]));
  const fields = {};
  const sourceUnknownFields = {};
  const allowed = FIELD_SETS[doc._type] ?? new Set();
  for (const [key, value] of Object.entries(doc)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    if (!allowed.has(key)) sourceUnknownFields[key] = value;
    fields[key] = transformImage(value, assetByFilename, { sanityId: doc._id, errors });
  }
  const result = {
    sanityId: doc._id,
    sanityType: doc._type,
    publicationState,
    ...(language ? { language } : {}),
    sourceCreatedAt: doc._createdAt ?? null,
    sourceUpdatedAt: doc._updatedAt ?? null,
    sourceRevision: doc._rev ?? null,
    ...(doc._system !== undefined ? { sourceSystem: structuredClone(doc._system) } : {}),
    ...fields,
    sourceUnknownFields,
    sourceDocument: structuredClone(doc),
    migration: { transformVersion: 1 },
  };
  if (doc.slug?.current !== undefined) result.slug = doc.slug.current;
  if (isArticle) {
    result.slug = doc.slug?.current ?? null;
    if (doc._type === "spanishPost") result.translationOfSanityId = doc.originalPost?._ref ?? null;
    result.authorSanityId = doc.author?._ref ?? null;
    result.categorySanityIds = (doc.categories ?? []).map((ref) => ref?._ref).filter(Boolean);
    result.tags = structuredClone(doc.tags ?? []);
    if (doc.publishedAt !== undefined) result.publishedAt = doc.publishedAt;
  }
  return { document: result, errors };
}

export function transformDocuments(documents, assetManifest) {
  const skipped = [];
  const transformed = [];
  const errors = [];
  for (const doc of documents) {
    if (doc._type === "subscriber") {
      skipped.push({ sanityId: doc._id, sanityType: doc._type, reason: "subscriber import intentionally disabled by Phase 2 decision" });
      continue;
    }
    const { document, errors: docErrors } = transformDocument(doc, assetManifest);
    transformed.push(document);
    errors.push(...docErrors);
  }
  return { transformed, skipped, errors };
}

export function validateReferences(sourceDocuments, transformedDocuments) {
  const sourceIds = new Set(sourceDocuments.filter((doc) => doc._type !== "subscriber").map((doc) => doc._id));
  const errors = [];
  for (const source of sourceDocuments) {
    if (source._type === "subscriber") continue;
    for (const ref of collectReferences(source)) {
      if (sourceIds.has(ref.sanityId)) continue;
      if (ref.weak) continue;
      errors.push({ kind: "unresolved_strong_reference", fromSanityId: source._id, toSanityId: ref.sanityId });
    }
  }
  const bySanityId = new Map(transformedDocuments.map((doc) => [doc.sanityId, doc]));
  for (const doc of transformedDocuments) {
    if (doc.translationOfSanityId && !bySanityId.has(doc.translationOfSanityId)) {
      errors.push({ kind: "unresolved_translation", sanityId: doc.sanityId, translationOfSanityId: doc.translationOfSanityId });
    }
  }
  return errors;
}

export function portableTextSummary(documents) {
  const summary = { blocks: 0, spans: 0, inlineImages: 0, orderedDocumentIds: [] };
  for (const doc of documents) {
    if (doc._type !== "post" && doc._type !== "spanishPost" && doc._type !== "author") continue;
    summary.orderedDocumentIds.push(doc._id);
    const walk = (value) => {
      if (Array.isArray(value)) return value.forEach(walk);
      if (!value || typeof value !== "object") return;
      if (value._type === "block") summary.blocks += 1;
      if (value._type === "span") summary.spans += 1;
      if (value._type === "image") summary.inlineImages += 1;
      Object.values(value).forEach(walk);
    };
    walk(doc.body ?? doc.bio ?? []);
  }
  return summary;
}

export function countTransformed(transformed) {
  const counts = {};
  const stateCounts = {};
  for (const doc of transformed) {
    counts[doc.sanityType] = (counts[doc.sanityType] ?? 0) + 1;
    const key = `${doc.sanityType}:${doc.publicationState}`;
    stateCounts[key] = (stateCounts[key] ?? 0) + 1;
  }
  return { counts, stateCounts, total: transformed.length };
}

export async function exportChecksums(dataText, assetsText) {
  return {
    dataNdjsonSha256: createHash("sha256").update(dataText).digest("hex"),
    assetsJsonSha256: createHash("sha256").update(assetsText).digest("hex"),
  };
}

export async function totalAssetBytes(assetManifest) {
  return assetManifest.reduce((sum, entry) => sum + entry.byteSize, 0);
}
