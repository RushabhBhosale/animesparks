#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import {
  EXPECTED_COUNTS,
  IMPORTED_TYPES,
  MigrationError,
  buildAssetManifest,
  countTransformed,
  exportChecksums,
  portableTextSummary,
  readExport,
  transformDocuments,
  validateReferences,
  validateSourceDocuments,
} from "../lib/migration/transform.mjs";
import { closeMongo, connectMongo, ensureMigrationIndexes, findPublishedArticles, getMigrationDatabaseName } from "../lib/migration/mongodb.mjs";
import { createR2Client, getR2Config, listBucketObjects, uploadAsset, verifyAssetObject } from "../lib/migration/r2.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATION_ENV_KEYS = new Set([
  "MONGODB_URI", "MONGODB_DB_NAME", "MONGODB_MAX_POOL_SIZE", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_S3_ENDPOINT", "R2_PUBLIC_BASE_URL", "R2_REGION",
]);
await loadMigrationEnvironment();
const args = parseArgs(process.argv.slice(2));

async function loadMigrationEnvironment() {
  const externallySet = new Set([...MIGRATION_ENV_KEYS].filter((key) => process.env[key] !== undefined));
  const fromFiles = {};
  for (const filename of [".env", ".env.local", ".env.migration.local"]) {
    let content;
    try { content = await readFile(path.join(ROOT, filename), "utf8"); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || !MIGRATION_ENV_KEYS.has(match[1])) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      fromFiles[match[1]] = value;
    }
  }
  for (const [key, value] of Object.entries(fromFiles)) {
    if (!externallySet.has(key)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const options = { mode: "dry-run", source: null, output: null, database: null, bucket: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.mode = setMode(options.mode, "dry-run");
    else if (arg === "--apply") options.mode = setMode(options.mode, "apply");
    else if (arg === "--verify-only") options.mode = setMode(options.mode, "verify-only");
    else if (["--source", "--output", "--database", "--bucket"].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
      options[arg.slice(2)] = value;
      index += 1;
    } else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!options.help && !options.source) throw new Error("--source <export-dir> is required.");
  return options;
}

function setMode(current, next) {
  if (current !== "dry-run" && current !== next) throw new Error("Choose only one of --dry-run, --apply, or --verify-only.");
  if (current === "dry-run" && next !== "dry-run" && process.argv.includes("--dry-run")) {
    throw new Error("Choose only one of --dry-run, --apply, or --verify-only.");
  }
  return next;
}

function printHelp() {
  console.log(`AnimeSparks Sanity export migration (dry-run is the default)

Usage:
  npm run migrate:sanity -- --source <export-dir> [--dry-run]
  npm run migrate:sanity -- --source <export-dir> --apply --database <staging-db> --bucket <staging-bucket>
  npm run migrate:sanity -- --source <export-dir> --verify-only --database <staging-db> --bucket <staging-bucket>

Optional:
  --output <directory>  Artifact output directory (default: migration-artifacts/<run-id>)
`);
}

function ensureStagingTarget(name, kind) {
  if (/(^|[-_])(prod|production|live)([-_]|$)/i.test(name)) {
    throw new Error(`Refusing ${kind} target that appears production-like: ${name}`);
  }
  if (!/(^|[-_])(stage|staging|stg)([-_]|$)/i.test(name)) {
    throw new Error(`The ${kind} target must be explicitly named with a staging marker (stage, staging, or stg): ${name}`);
  }
}

function assertEqual(actual, expected, label, errors) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push({ kind: "validation_mismatch", label, expected, actual });
}

function addPublicAssetUrls(value, publicBaseUrl) {
  if (Array.isArray(value)) return value.map((item) => addPublicAssetUrls(item, publicBaseUrl));
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, addPublicAssetUrls(child, publicBaseUrl)]));
  if (result.asset?.r2Key && publicBaseUrl) result.asset.publicUrl = `${publicBaseUrl}/${result.asset.r2Key}`;
  return result;
}

function validateTransformed(sourceDocs, transformedDocs, assetResult, transformErrors) {
  const errors = [...transformErrors];
  const byId = new Map(transformedDocs.map((doc) => [doc.sanityId, doc]));
  const expectedSource = sourceDocs.filter((doc) => doc._type !== "subscriber");
  if (byId.size !== expectedSource.length) errors.push({ kind: "transformed_document_count_mismatch", expected: expectedSource.length, actual: byId.size });
  for (const source of expectedSource) {
    const output = byId.get(source._id);
    if (!output) {
      errors.push({ kind: "source_document_dropped", sanityId: source._id, sanityType: source._type });
      continue;
    }
    if (output.sanityType !== source._type) errors.push({ kind: "sanity_type_not_preserved", sanityId: source._id, expected: source._type, actual: output.sanityType });
    if (output.sourceCreatedAt !== (source._createdAt ?? null) || output.sourceUpdatedAt !== (source._updatedAt ?? null) || output.sourceRevision !== (source._rev ?? null)) {
      errors.push({ kind: "source_timestamps_not_preserved", sanityId: source._id });
    }
    const expectedState = source._id.startsWith("drafts.") ? "draft" : "published";
    if (output.publicationState !== expectedState) errors.push({ kind: "publication_state_mismatch", sanityId: source._id, expected: expectedState, actual: output.publicationState });
    if (source._type === "spanishPost" && output.translationOfSanityId !== (source.originalPost?._ref ?? null)) {
      errors.push({ kind: "translation_reference_not_preserved", sanityId: source._id });
    }
    for (const field of ["metaTitle", "metaDescription", "excerpt", "publishedAt", "updatedAt", "slug", "title"]) {
      if (JSON.stringify(output.sourceDocument[field] ?? null) !== JSON.stringify(source[field] ?? null)) {
        errors.push({ kind: "optional_field_not_preserved", sanityId: source._id, field });
      }
    }
  }
  const drafts = transformedDocs.filter((doc) => doc.sanityType === "post" && doc.publicationState === "draft");
  const publishedIndex = transformedDocs.filter((doc) => doc.publicationState === "published");
  if (drafts.length !== 5) errors.push({ kind: "draft_count_mismatch", expected: 5, actual: drafts.length });
  if (publishedIndex.some((doc) => doc.sanityId.startsWith("drafts."))) errors.push({ kind: "draft_in_published_index" });
  const sourcePortable = portableTextSummary(sourceDocs);
  const migratedPortable = portableTextSummary(transformedDocs.map((doc) => ({
    ...doc,
    _id: doc.sanityId,
    _type: doc.sanityType,
    body: doc.body,
    bio: doc.bio,
  })));
  assertEqual(migratedPortable, sourcePortable, "Portable Text structure and ordering", errors);
  if (assetResult.manifest.length !== Object.keys(assetResult.assets ?? {}).length && assetResult.assets) {
    errors.push({ kind: "asset_manifest_count_mismatch", expected: Object.keys(assetResult.assets).length, actual: assetResult.manifest.length });
  }
  return { errors, sourcePortable, migratedPortable };
}

function buildHumanReport({ runId, sourceDir, mode, sourceCounts, targetCounts, assetResult, transformedSummary, skipped, errors, warnings, portableText, checksums, target, applyResult, verification }) {
  const lines = [
    "# Sanity migration run report",
    "",
    `- Run ID: \`${runId}\``,
    `- Mode: **${mode}**`,
    `- Source: \`${sourceDir}\``,
    `- Started: ${new Date().toISOString()}`,
    `- Target: ${target ? `MongoDB \`${target.database}\`, R2 bucket \`${target.bucket}\`` : "none (dry-run)"}`,
    "",
    "## Source and transformed counts",
    "",
    "| Type | Source | Target documents |",
    "|---|---:|---:|",
  ];
  for (const type of [...IMPORTED_TYPES, "subscriber"]) {
    lines.push(`| \`${type}\` | ${sourceCounts[type] ?? 0} | ${type === "subscriber" ? 0 : transformedSummary.counts[type] ?? 0} |`);
  }
  lines.push(
    `| Total | ${Object.values(sourceCounts).reduce((sum, value) => sum + value, 0)} | ${transformedSummary.total} |`,
    "",
    "## Asset verification",
    "",
    `- Asset records: ${assetResult.manifest.length}`,
    `- \`_sanityAsset\` references: ${assetResult.referenceCount}`,
    `- Distinct referenced files: ${assetResult.referencedFilenameCount}`,
    `- Verified bytes: ${assetResult.manifest.reduce((sum, asset) => sum + asset.byteSize, 0)}`,
    `- Unreferenced assets: ${assetResult.manifest.filter((asset) => !asset.referenced).length}`,
    "- Asset errors: " + assetResult.errors.length,
    "",
    "## Drafts and Portable Text",
    "",
    `- English drafts retained: ${transformedSummary.stateCounts["post:draft"] ?? 0}`,
    `- Portable Text blocks / spans / inline images: ${portableText.blocks} / ${portableText.spans} / ${portableText.inlineImages}`,
    "- Drafts are marked `publicationState: draft`; public selection must require `publicationState: published`.",
    "",
    "## Staging result",
    "",
    verification ? `- MongoDB collection counts: \`${JSON.stringify(verification.collectionCounts)}\`` : applyResult ? `- MongoDB upserts: \`${JSON.stringify(applyResult.written)}\`; asset manifest upserts: ${applyResult.uploadedAssets}` : "- MongoDB/R2 staging verification was not requested.",
    verification ? `- Published article query count: ${verification.publicArticleCount}; published query returned no drafts.` : "",
    verification ? `- R2 bucket objects/bytes: ${verification.r2Inventory.bucketObjectCount} / ${verification.r2Inventory.bucketTotalBytes}; imported prefix objects/bytes: ${verification.r2Inventory.importedObjectCount} / ${verification.r2Inventory.importedTotalBytes}.` : "",
    verification ? `- R2 objects verified by content SHA-1 and byte size: ${verification.r2Inventory.verifiedObjectCount}/${assetResult.manifest.length}.` : "",
    verification ? `- MongoDB image reference mappings checked: ${verification.mappedImageReferenceCount}/${assetResult.referenceCount}.` : "",
    verification ? "- Idempotency evidence: unique `sanityId` indexes, deterministic R2 keys, and exact target ID/key sets. No second write pass was run." : "",
    "",
    "## Source checksums",
    "",
    `- data.ndjson SHA-256: \`${checksums.dataNdjsonSha256}\``,
    `- assets.json SHA-256: \`${checksums.assetsJsonSha256}\``,
    "",
    "## Skipped records",
    "",
    skipped.length ? skipped.map((entry) => `- \`${entry.sanityId}\` (\`${entry.sanityType}\`): ${entry.reason}`).join("\n") : "None.",
    "",
    "## Errors",
    "",
    errors.length ? errors.map((entry) => `- \`${entry.kind}\`: \`${JSON.stringify(entry)}\``).join("\n") : "None.",
    "",
    "## Warnings",
    "",
    warnings.length ? warnings.map((entry) => `- \`${entry.kind}\`: \`${JSON.stringify(entry)}\``).join("\n") : "None.",
    "",
    mode === "dry-run" ? "No MongoDB or R2 writes were performed." : "",
    "",
  );
  return lines.filter((line) => line !== undefined).join("\n");
}

async function compareExistingDatabase(db, transformed, assetManifest, errors, runId, sourceSnapshot, r2Config) {
  const docsByCollection = new Map([
    ["articles", transformed.filter((doc) => ["post", "spanishPost"].includes(doc.sanityType))],
    ["categories", transformed.filter((doc) => doc.sanityType === "category")],
    ["authors", transformed.filter((doc) => doc.sanityType === "author")],
    ["animeEntries", transformed.filter((doc) => doc.sanityType === "animeEntry")],
    ["homepageSettings", transformed.filter((doc) => doc.sanityType === "homepageSettings")],
  ]);
  const targetDocuments = new Map();
  for (const [name, expected] of docsByCollection) {
    const collection = db.collection(name);
    const actualCount = await collection.countDocuments({});
    if (actualCount !== expected.length) errors.push({ kind: "target_collection_count_mismatch", collection: name, expected: expected.length, actual: actualCount });
    const actualDocuments = await collection.find({}).toArray();
    targetDocuments.set(name, actualDocuments);
    const actualById = new Map(actualDocuments.map((document) => [document.sanityId, document]));
    for (const document of expected) {
      const actual = actualById.get(document.sanityId);
      if (!actual) {
        errors.push({ kind: "target_document_missing", collection: name, sanityId: document.sanityId });
        continue;
      }
      if (actual.sanityType !== document.sanityType || actual.publicationState !== document.publicationState || actual.language !== document.language || actual.slug !== document.slug) {
        errors.push({ kind: "target_article_identity_mismatch", collection: name, sanityId: document.sanityId });
      }
      if (actual.translationOfSanityId !== document.translationOfSanityId || actual.authorSanityId !== document.authorSanityId || !isDeepStrictEqual(actual.categorySanityIds, document.categorySanityIds)) {
        errors.push({ kind: "target_article_relationship_mismatch", sanityId: document.sanityId });
      }
      if (!isDeepStrictEqual(actual.sourceDocument, document.sourceDocument)) {
        errors.push({ kind: "source_metadata_not_preserved", sanityId: document.sanityId });
      }
      const { _id: _mongoId, ...actualWithoutMongoId } = actual;
      if (!isDeepStrictEqual(actualWithoutMongoId, addPublicAssetUrls(document, r2Config.publicBaseUrl))) {
        errors.push({ kind: "normalized_document_mismatch", sanityId: document.sanityId });
      }
    }
  }
  const publishedDraft = await db.collection("articles").findOne({ sanityId: /^drafts\./, publicationState: "published" }, { projection: { _id: 0, sanityId: 1 } });
  if (publishedDraft) errors.push({ kind: "draft_in_target_published_index", sanityId: publishedDraft.sanityId });
  const run = await db.collection("migrationRuns").findOne({ runId }, { projection: { _id: 0, status: 1, sourceSnapshot: 1 } });
  if (!run || run.status !== "completed" || run.sourceSnapshot !== sourceSnapshot) {
    errors.push({ kind: "migration_run_record_mismatch", runId, expectedStatus: "completed", actualStatus: run?.status ?? null });
  }
  const assetCollection = db.collection("assets");
  const actualAssetCount = await assetCollection.countDocuments({});
  if (actualAssetCount !== assetManifest.length) errors.push({ kind: "target_collection_count_mismatch", collection: "assets", expected: assetManifest.length, actual: actualAssetCount });
  const actualAssets = await assetCollection.find({}).toArray();
  const actualAssetsById = new Map(actualAssets.map((asset) => [asset.sanityId, asset]));
  for (const asset of assetManifest) {
    const existing = actualAssetsById.get(asset.sanityId);
    if (!existing) errors.push({ kind: "target_asset_missing", sanityId: asset.sanityId });
    else if (existing.sha1 !== asset.sha1 || existing.r2Key !== asset.r2Key || existing.byteSize !== asset.byteSize || !isDeepStrictEqual(existing.sourceMetadata, asset.sourceMetadata)) {
      errors.push({ kind: "target_asset_mismatch", sanityId: asset.sanityId });
    }
  }
  const expectedArticleCount = docsByCollection.get("articles").length;
  const actualArticleCount = targetDocuments.get("articles")?.length ?? 0;
  const expectedPublicArticleCount = docsByCollection.get("articles").filter((doc) => doc.publicationState === "published").length;
  const publicArticles = await findPublishedArticles(db);
  if (publicArticles.length !== expectedPublicArticleCount || publicArticles.some((doc) => doc.sanityId.startsWith("drafts."))) {
    errors.push({ kind: "published_query_includes_draft_or_count_mismatch", expected: expectedPublicArticleCount, actual: publicArticles.length });
  }
  const actualAllIds = new Set([...targetDocuments.values()].flat().map((doc) => doc.sanityId));
  if (actualAllIds.size !== transformed.length || expectedArticleCount !== 248 || actualArticleCount !== expectedArticleCount) {
    errors.push({ kind: "target_sanity_id_set_mismatch", expected: transformed.length, actual: actualAllIds.size });
  }
  const migrationRunCount = await db.collection("migrationRuns").countDocuments({});
  if (migrationRunCount !== 1) errors.push({ kind: "migration_run_count_mismatch", expected: 1, actual: migrationRunCount });
  const subscriberCollection = await db.listCollections({ name: "subscribers" }, { nameOnly: true }).hasNext();
  if (subscriberCollection) errors.push({ kind: "subscriber_collection_present" });
  return {
    collectionCounts: Object.fromEntries([...docsByCollection.keys()].map((name) => [name, targetDocuments.get(name)?.length ?? 0]).concat([["assets", actualAssetCount], ["migrationRuns", migrationRunCount]])),
    publicArticleCount: publicArticles.length,
    sourceDocuments: [...targetDocuments.values()].flat().map((doc) => doc.sourceDocument),
    normalizedDocuments: [...targetDocuments.values()].flat(),
  };
}

function countMappedImageReferences(documents) {
  let count = 0;
  const errors = [];
  const walk = (value, sanityId) => {
    if (Array.isArray(value)) return value.forEach((child) => walk(child, sanityId));
    if (!value || typeof value !== "object") return;
    if (typeof value.sourceSanityAsset === "string") {
      count += 1;
      if (!value.asset?.sanityId || !value.asset?.r2Key) errors.push({ kind: "normalized_asset_mapping_missing", sanityId });
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === "sourceDocument") continue;
      walk(child, sanityId);
    }
  };
  documents.forEach((doc) => walk(doc, doc.sanityId));
  return { count, errors };
}

async function applyMigration(db, transformed, assetManifest, s3, r2Config, runRecord) {
  let stage = "create MongoDB indexes";
  await ensureMigrationIndexes(db);
  const runs = db.collection("migrationRuns");
  await runs.updateOne({ runId: runRecord.runId }, { $set: { ...runRecord, status: "running", startedAt: new Date() } }, { upsert: true });
  const uploaded = [];
  try {
    for (const asset of assetManifest) {
      stage = `upload R2 asset ${asset.sanityId}`;
      const uploadedAsset = await uploadAsset(s3, r2Config, asset);
      const storedAsset = { ...uploadedAsset };
      delete storedAsset.localPath;
      stage = `upsert MongoDB asset ${asset.sanityId}`;
      await db.collection("assets").replaceOne({ sanityId: asset.sanityId }, storedAsset, { upsert: true });
      uploaded.push(asset.sanityId);
    }
    const typeToCollection = {
      post: "articles", spanishPost: "articles", category: "categories", author: "authors",
      animeEntry: "animeEntries", homepageSettings: "homepageSettings",
    };
    const written = {};
    for (const doc of transformed) {
      const collectionName = typeToCollection[doc.sanityType];
      if (!collectionName) throw new Error(`No collection mapping for ${doc.sanityType}`);
      const storedDoc = addPublicAssetUrls(doc, r2Config.publicBaseUrl);
      stage = `upsert MongoDB ${collectionName} document ${doc.sanityId}`;
      await db.collection(collectionName).replaceOne({ sanityId: doc.sanityId }, storedDoc, { upsert: true });
      written[collectionName] = (written[collectionName] ?? 0) + 1;
    }
    await runs.updateOne({ runId: runRecord.runId }, { $set: { status: "completed", completedAt: new Date(), written, uploadedAssets: uploaded.length } });
    return { written, uploadedAssets: uploaded.length };
  } catch (error) {
    const failureName = error?.name ?? "Error";
    await runs.updateOne({ runId: runRecord.runId }, { $set: { status: "failed", failedAt: new Date(), uploadedAssets: uploaded.length, failureStage: stage, failureName } });
    throw new MigrationError(`${stage} failed (${failureName}).`, { stage, failureName, uploadedAssetsBeforeFailure: uploaded.length });
  }
}

async function run() {
  if (args.help) return printHelp();
  const sourceDir = path.resolve(ROOT, args.source);
  const exportData = await readExport(sourceDir);
  const sourceValidation = validateSourceDocuments(exportData.documents);
  const assetResult = await buildAssetManifest(sourceDir, exportData.assets, exportData.documents);
  assetResult.assets = exportData.assets;
  const { transformed, skipped, errors: transformErrors } = transformDocuments(exportData.documents, assetResult.manifest);
  const transformValidation = validateTransformed(exportData.documents, transformed, assetResult, transformErrors);
  const referenceErrors = validateReferences(exportData.documents, transformed);
  const errors = [...sourceValidation.errors, ...assetResult.errors, ...transformValidation.errors, ...referenceErrors];
  const warnings = [...assetResult.warnings];
  const checksums = await exportChecksums(exportData.dataText, exportData.assetsText);
  const runId = createHash("sha256").update(`${checksums.dataNdjsonSha256}:${checksums.assetsJsonSha256}`).digest("hex").slice(0, 24);
  const transformedSummary = countTransformed(transformed);
  const portableText = portableTextSummary(exportData.documents);
  const targetCounts = transformedSummary.counts;
  let target = null;
  let mongo;
  let r2Client;
  let applyResult = null;
  let verification = null;

  if (args.mode !== "dry-run") {
    const database = getMigrationDatabaseName(process.env, args.database);
    const bucket = args.bucket?.trim();
    if (!args.database || !bucket) throw new Error("--apply and --verify-only require explicit --database and --bucket staging targets.");
    ensureStagingTarget(database, "MongoDB database");
    ensureStagingTarget(bucket, "R2 bucket");
    target = { database, bucket };
    const r2Config = getR2Config(process.env, bucket);
    r2Client = createR2Client(r2Config);
    const mongoClient = await connectMongo(process.env);
    mongo = { client: mongoClient, db: mongoClient.db(database), r2Config };
    if (args.mode === "apply") {
      const invalid = [...errors];
      if (invalid.length) throw new MigrationError(`Refusing --apply because validation found ${invalid.length} error(s).`, { errors: invalid });
      applyResult = await applyMigration(mongo.db, transformed, assetResult.manifest, r2Client, r2Config, {
        runId,
        sourceSnapshot: checksums.dataNdjsonSha256,
        sourceDir,
        transformVersion: 1,
        sourceCounts: sourceValidation.counts,
        targetCounts,
        skipped,
      });
    } else {
      verification = await compareExistingDatabase(mongo.db, transformed, assetResult.manifest, errors, runId, checksums.dataNdjsonSha256, r2Config);
      const [bucketInventory, assetInventory] = await Promise.all([
        listBucketObjects(r2Client, bucket),
        listBucketObjects(r2Client, bucket, "sanity/"),
      ]);
      const expectedAssetKeys = new Set(assetResult.manifest.map((asset) => asset.r2Key));
      const actualAssetKeys = new Set(assetInventory.objects.map((object) => object.key));
      if (assetInventory.count !== assetResult.manifest.length || assetInventory.totalBytes !== assetResult.manifest.reduce((sum, asset) => sum + asset.byteSize, 0)) {
        errors.push({ kind: "r2_asset_inventory_mismatch", expectedCount: assetResult.manifest.length, actualCount: assetInventory.count, expectedBytes: assetResult.manifest.reduce((sum, asset) => sum + asset.byteSize, 0), actualBytes: assetInventory.totalBytes });
      }
      if (expectedAssetKeys.size !== actualAssetKeys.size || [...expectedAssetKeys].some((key) => !actualAssetKeys.has(key))) {
        errors.push({ kind: "r2_asset_key_set_mismatch", expectedCount: expectedAssetKeys.size, actualCount: actualAssetKeys.size });
      }
      verification.r2Inventory = {
        bucketObjectCount: bucketInventory.count,
        bucketTotalBytes: bucketInventory.totalBytes,
        importedObjectCount: assetInventory.count,
        importedTotalBytes: assetInventory.totalBytes,
      };
      let verifiedObjectCount = 0;
      for (let offset = 0; offset < assetResult.manifest.length; offset += 8) {
        const batch = assetResult.manifest.slice(offset, offset + 8);
        await Promise.all(batch.map(async (asset) => {
          try {
            await verifyAssetObject(r2Client, r2Config, asset);
            verifiedObjectCount += 1;
          } catch (error) {
            errors.push({ kind: "r2_verification_error", sanityId: asset.sanityId, errorName: error?.name ?? "Error" });
          }
        }));
      }
      verification.r2Inventory.verifiedObjectCount = verifiedObjectCount;
      const mappedImages = countMappedImageReferences(verification.normalizedDocuments);
      errors.push(...mappedImages.errors);
      if (mappedImages.count !== assetResult.referenceCount) {
        errors.push({ kind: "mongo_image_reference_count_mismatch", expected: assetResult.referenceCount, actual: mappedImages.count });
      }
      const targetSourceById = new Map(verification.sourceDocuments.map((doc) => [doc._id, doc]));
      const orderedActualSource = transformed.map((doc) => targetSourceById.get(doc.sanityId)).filter(Boolean);
      const actualPortableText = portableTextSummary(orderedActualSource);
      if (!isDeepStrictEqual(actualPortableText, portableText)) errors.push({ kind: "portable_text_source_snapshot_mismatch" });
      verification.mappedImageReferenceCount = mappedImages.count;
      verification.portableText = actualPortableText;
    }
    await mongo.client.close();
  }

  const outputDir = path.resolve(ROOT, args.output ?? path.join("migration-artifacts", runId));
  await mkdir(outputDir, { recursive: true });
  const manifest = {
    runId,
    mode: args.mode,
    source: { directory: sourceDir, ...checksums },
    target: target ?? { database: null, bucket: null },
    expectedSourceCounts: EXPECTED_COUNTS,
    sourceCounts: sourceValidation.counts,
    targetCounts,
    transformedDocumentCount: transformed.length,
    publicationStateCounts: transformedSummary.stateCounts,
    skipped,
    errors,
    warnings,
    portableText,
    assetSummary: {
      count: assetResult.manifest.length,
      referenceCount: assetResult.referenceCount,
      distinctReferencedFiles: assetResult.referencedFilenameCount,
      verifiedBytes: assetResult.manifest.reduce((sum, asset) => sum + asset.byteSize, 0),
      referenced: assetResult.manifest.filter((asset) => asset.referenced).length,
      unreferenced: assetResult.manifest.filter((asset) => !asset.referenced).length,
    },
    assets: assetResult.manifest.map(({ localPath, ...asset }) => asset),
    documentIds: transformed.map((doc) => ({ sanityId: doc.sanityId, sanityType: doc.sanityType, language: doc.language ?? null, slug: doc.slug ?? null, publicationState: doc.publicationState })),
    applyResult,
    verification: verification ? {
      collectionCounts: verification.collectionCounts,
      publicArticleCount: verification.publicArticleCount,
      mappedImageReferenceCount: verification.mappedImageReferenceCount,
      portableText: verification.portableText,
      r2Inventory: verification.r2Inventory,
      idempotency: "Verified by unique sanityId indexes, deterministic R2 keys, exact target ID/key sets, and exact post-import counts; no second write pass was run.",
    } : null,
  };
  await writeFile(path.join(outputDir, "migration-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const report = buildHumanReport({ runId, sourceDir, mode: args.mode, sourceCounts: sourceValidation.counts, targetCounts, assetResult, transformedSummary, skipped, errors, warnings, portableText, checksums, target, applyResult, verification });
  await writeFile(path.join(outputDir, "migration-report.md"), report);
  console.log(`Migration ${args.mode} complete: ${outputDir}`);
  console.log(`Documents: ${transformed.length}; assets verified: ${assetResult.manifest.length}; subscriber skipped: ${skipped.length}; errors: ${errors.length}; warnings: ${warnings.length}`);
  if (errors.length) process.exitCode = 1;
}

try {
  await run();
} catch (error) {
  console.error(error.message);
  if (error.details) console.error(JSON.stringify(error.details, null, 2));
  process.exitCode = 1;
}
