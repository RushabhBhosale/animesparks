#!/usr/bin/env node
import { isDeepStrictEqual } from "node:util";
import { MongoClient } from "mongodb";
import nextEnv from "@next/env";
import { findPublishedArticles } from "../lib/migration/mongodb.mjs";
import { assertDocumentMirror, planDocumentCopy } from "../lib/migration/production-copy.mjs";
const { loadEnvConfig } = nextEnv;

const SOURCE_DB = "animesparks_staging";
const TARGET_DB = "animesparks";
const EXPECTED_COUNTS = Object.freeze({
  articles: 248,
  categories: 6,
  authors: 1,
  animeEntries: 131,
  homepageSettings: 1,
  assets: 578,
});
const COLLECTIONS = Object.keys(EXPECTED_COUNTS);
const REQUIRED_INDEX_NAMES = Object.freeze({
  articles: ["_id_", "sanity_id_unique", "article_slug_lookup", "published_article_slug_unique_per_language", "article_listing_by_date", "article_category_listing", "article_tag_listing", "article_franchise_listing"],
  categories: ["_id_", "sanity_id_unique", "category_slug_unique"],
  authors: ["_id_", "sanity_id_unique", "author_slug_unique"],
  animeEntries: ["_id_", "sanity_id_unique", "anime_title"],
  homepageSettings: ["_id_", "sanity_id_unique"],
  assets: ["_id_", "sanity_id_unique", "sha1_unique", "r2_key_unique"],
});

if (SOURCE_DB === TARGET_DB) throw new Error("Refusing to copy: source and destination database names must differ.");
loadEnvConfig(process.cwd());

function parseArgs(argv) {
  const options = { apply: false, verifyOnly: false, help: false };
  for (const arg of argv) {
    if (arg === "--apply") options.apply = true;
    else if (arg === "--verify-only") options.verifyOnly = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (options.apply && options.verifyOnly) throw new Error("Choose either --apply or --verify-only.");
  return options;
}

function printHelp() {
  console.log(`Copy verified AnimeSparks staging content into the production database.

Usage:
  npm run copy:production-db                 # read-only dry run (default)
  npm run copy:production-db -- --apply      # copy, create indexes, and verify
  npm run copy:production-db -- --verify-only # verify source and destination only

Reads MONGODB_URI from the current environment or the standard Next.js env files.
The source and destination database names are fixed to ${SOURCE_DB} and ${TARGET_DB}.
`);
}

function indexInput(index) {
  const { key, name, ns: _ns, v: _version, ...options } = index;
  return { key, options: { name, ...options } };
}

async function countsFor(db) {
  return Object.fromEntries(await Promise.all(COLLECTIONS.map(async (name) => [name, await db.collection(name).countDocuments({})])));
}

async function indexesIfCollectionExists(db, name) {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
  return exists ? db.collection(name).listIndexes().toArray() : [];
}

function assertExpectedCounts(counts, label) {
  const mismatches = Object.entries(EXPECTED_COUNTS).filter(([name, expected]) => counts[name] !== expected);
  if (mismatches.length) throw new Error(`${label} collection count mismatch: ${mismatches.map(([name, expected]) => `${name} expected ${expected}, got ${counts[name]}`).join("; ")}.`);
}

async function assertContentInvariants(db, label) {
  const articles = db.collection("articles");
  const [publishedEnglish, publishedSpanish, drafts, publicRows, spanishRows] = await Promise.all([
    articles.countDocuments({ language: "en", publicationState: "published" }),
    articles.countDocuments({ language: "es", publicationState: "published" }),
    articles.countDocuments({ publicationState: "draft" }),
    findPublishedArticles(db, {}, { projection: { _id: 0, sanityId: 1, publicationState: 1 } }),
    articles.find({ language: "es", publicationState: "published" }, { projection: { _id: 0, sanityId: 1, translationOfSanityId: 1 } }).toArray(),
  ]);
  if (publishedEnglish !== 230) throw new Error(`${label} invariant failed: published English expected 230, got ${publishedEnglish}.`);
  if (publishedSpanish !== 13) throw new Error(`${label} invariant failed: published Spanish expected 13, got ${publishedSpanish}.`);
  if (drafts !== 5) throw new Error(`${label} invariant failed: drafts expected 5, got ${drafts}.`);
  const leakedDrafts = publicRows.filter((doc) => doc.publicationState !== "published" || doc.sanityId?.startsWith("drafts."));
  if (leakedDrafts.length) throw new Error(`${label} invariant failed: public published query returned ${leakedDrafts.length} draft or non-published records.`);

  const originalIds = [...new Set(spanishRows.map((doc) => doc.translationOfSanityId).filter(Boolean))];
  const originals = await articles.find({ sanityId: { $in: originalIds }, language: "en", publicationState: "published" }, { projection: { _id: 0, sanityId: 1 } }).toArray();
  const validOriginalIds = new Set(originals.map((doc) => doc.sanityId));
  const invalidRelationships = spanishRows.filter((doc) => !doc.translationOfSanityId || !validOriginalIds.has(doc.translationOfSanityId));
  if (spanishRows.length !== 13 || invalidRelationships.length) {
    throw new Error(`${label} invariant failed: ${13 - invalidRelationships.length}/${spanishRows.length} Spanish original-post relationships are valid.`);
  }
  return { publishedEnglish, publishedSpanish, drafts, publicDraftLeaks: 0, spanishRelationships: `${spanishRows.length}/${spanishRows.length}` };
}

async function loadSource(db) {
  const counts = await countsFor(db);
  assertExpectedCounts(counts, "Staging source");
  const invariants = await assertContentInvariants(db, "Staging source");
  const documents = Object.fromEntries(await Promise.all(COLLECTIONS.map(async (name) => [name, await db.collection(name).find({}).toArray()])));
  for (const name of COLLECTIONS) if (documents[name].length !== EXPECTED_COUNTS[name]) throw new Error(`Staging source changed while reading ${name}; refusing to copy.`);
  const indexes = Object.fromEntries(await Promise.all(COLLECTIONS.map(async (name) => {
    const specs = await db.collection(name).listIndexes().toArray();
    const names = new Set(specs.map((index) => index.name));
    const missing = REQUIRED_INDEX_NAMES[name].filter((indexName) => !names.has(indexName));
    if (missing.length) throw new Error(`Staging source is missing required ${name} indexes: ${missing.join(", ")}.`);
    return [name, specs];
  })));
  return { counts, invariants, documents, indexes };
}

async function inspectDestination(db, source) {
  const existing = {};
  const toInsert = {};
  const existingIndexes = {};
  for (const name of COLLECTIONS) {
    const targetDocs = await db.collection(name).find({}).toArray();
    toInsert[name] = planDocumentCopy(source.documents[name], targetDocs, name);
    existing[name] = targetDocs.length;
    existingIndexes[name] = await indexesIfCollectionExists(db, name);
    const destinationIndexesByName = new Map(existingIndexes[name].map((index) => [index.name, indexInput(index)]));
    for (const sourceIndex of source.indexes[name]) {
      const targetIndex = destinationIndexesByName.get(sourceIndex.name);
      if (targetIndex && !isDeepStrictEqual(targetIndex, indexInput(sourceIndex))) {
        throw new Error(`Destination ${name} has a conflicting definition for index ${sourceIndex.name}; refusing to modify it.`);
      }
    }
  }
  return { existing, toInsert, existingIndexes };
}

async function createSourceIndexesOnDestination(db, sourceIndexes) {
  for (const name of COLLECTIONS) {
    for (const index of sourceIndexes[name]) {
      if (index.name === "_id_") continue;
      const { key, options } = indexInput(index);
      await db.collection(name).createIndex(key, options);
    }
  }
}

async function verifyDestination(db, source) {
  const counts = await countsFor(db);
  assertExpectedCounts(counts, "Destination");
  const invariants = await assertContentInvariants(db, "Destination");
  for (const name of COLLECTIONS) {
    const targetDocs = await db.collection(name).find({}).toArray();
    assertDocumentMirror(source.documents[name], targetDocs, name);
    const actualIndexes = await db.collection(name).listIndexes().toArray();
    const actualByName = new Map(actualIndexes.map((index) => [index.name, indexInput(index)]));
    for (const sourceIndex of source.indexes[name]) {
      const actual = actualByName.get(sourceIndex.name);
      if (!actual || !isDeepStrictEqual(actual, indexInput(sourceIndex))) throw new Error(`Destination ${name} is missing or differs from staging index ${sourceIndex.name}.`);
    }
  }
  return { counts, invariants };
}

function redact(message, uri) {
  let safe = String(message ?? "Unknown error");
  if (uri) {
    safe = safe.split(uri).join("[REDACTED_MONGODB_URI]");
    const auth = uri.match(/:\/\/([^:@/]+)(?::([^@]*))?@/);
    for (const value of auth?.slice(1).filter(Boolean) ?? []) {
      for (const secret of new Set([value, decodeURIComponent(value)])) safe = safe.split(secret).join("[REDACTED]");
    }
  }
  return safe.replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, "[REDACTED_MONGODB_URI]");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required. Set it in your environment or a local Next.js env file.");

  const client = new MongoClient(uri, { maxPoolSize: 4 });
  try {
    await client.connect();
    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);
    const source = await loadSource(sourceDb);
    const destination = await inspectDestination(targetDb, source);

    if (options.verifyOnly) {
      const verified = await verifyDestination(targetDb, source);
      console.log(JSON.stringify({ mode: "verify-only", source: SOURCE_DB, destination: TARGET_DB, counts: verified.counts, invariants: verified.invariants, copiedCollections: COLLECTIONS }, null, 2));
      return;
    }

    const plannedInserts = Object.fromEntries(COLLECTIONS.map((name) => [name, destination.toInsert[name].length]));
    const plannedIndexes = Object.fromEntries(COLLECTIONS.map((name) => {
      const existingNames = new Set(destination.existingIndexes[name].map((index) => index.name));
      return [name, source.indexes[name].filter((index) => index.name !== "_id_" && !existingNames.has(index.name)).length];
    }));
    if (!options.apply) {
      console.log(JSON.stringify({ mode: "dry-run", source: SOURCE_DB, destination: TARGET_DB, sourceCounts: source.counts, sourceInvariants: source.invariants, destinationExistingCounts: destination.existing, plannedDocumentInserts: plannedInserts, plannedIndexes, collections: COLLECTIONS, includesMigrationRuns: false, includesSubscribers: false, writesPerformed: false }, null, 2));
      return;
    }

    await createSourceIndexesOnDestination(targetDb, source.indexes);
    for (const name of COLLECTIONS) {
      const pending = destination.toInsert[name];
      if (pending.length) await targetDb.collection(name).insertMany(pending, { ordered: true });
    }
    const verified = await verifyDestination(targetDb, source);
    console.log(JSON.stringify({ mode: "apply-and-verify", source: SOURCE_DB, destination: TARGET_DB, counts: verified.counts, invariants: verified.invariants, insertedDocuments: plannedInserts, createdIndexes: plannedIndexes, copiedIndexesFromStaging: true }, null, 2));
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : error, uri), { cause: error });
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`Production database copy stopped: ${redact(error instanceof Error ? error.message : error, process.env.MONGODB_URI)}`);
  process.exitCode = 1;
});
