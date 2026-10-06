import { MongoClient } from "mongodb";

const CLIENT_KEY = Symbol.for("animesparks.migration.mongo.client");
const PROMISE_KEY = Symbol.for("animesparks.migration.mongo.promise");
const URI_KEY = Symbol.for("animesparks.migration.mongo.uri");
const DIAGNOSTIC_KEY = Symbol.for("animesparks.migration.mongo.diagnostic");

function attachPoolDiagnostics(client, env) {
  const slug = env.ANIMESPARKS_DIAG_SLUG?.trim();
  if (!slug || client[DIAGNOSTIC_KEY]) return;
  client[DIAGNOSTIC_KEY] = true;
  let openConnections = 0;
  const log = (stage, extra = {}) => console.info("[animesparks-static-diagnostic]", JSON.stringify({
    slug,
    stage,
    pid: process.pid,
    openConnections,
    ...extra,
  }));
  log("mongodb.pool.config", {
    maxPoolSize: client.options.maxPoolSize ?? 100,
    serverSelectionTimeoutMS: client.options.serverSelectionTimeoutMS ?? 30000,
    connectTimeoutMS: client.options.connectTimeoutMS ?? 30000,
    socketTimeoutMS: client.options.socketTimeoutMS ?? 0,
    waitQueueTimeoutMS: client.options.waitQueueTimeoutMS ?? 0,
  });
  client.on("connectionCreated", () => { openConnections += 1; log("mongodb.pool.connection-created"); });
  client.on("connectionClosed", () => { openConnections = Math.max(0, openConnections - 1); log("mongodb.pool.connection-closed"); });
  client.on("connectionCheckOutStarted", () => log("mongodb.pool.checkout-started"));
  client.on("connectionCheckedOut", (event) => log("mongodb.pool.checked-out", { durationMS: event.durationMS }));
  client.on("connectionCheckOutFailed", (event) => log("mongodb.pool.checkout-failed", {
    durationMS: event.durationMS,
    reason: event.reason,
  }));
  client.on("connectionPoolCleared", () => log("mongodb.pool.cleared"));
}

export const PUBLIC_ARTICLE_FILTER = Object.freeze({ publicationState: "published" });

export function getMongoClient(env = process.env) {
  const uri = env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required for MongoDB operations.");
  const poolSize = Number.parseInt(env.MONGODB_MAX_POOL_SIZE ?? "10", 10);
  const options = { maxPoolSize: Number.isFinite(poolSize) && poolSize > 0 ? poolSize : 10 };
  const globalStore = globalThis;
  if (globalStore[CLIENT_KEY] && globalStore[URI_KEY] === uri) {
    attachPoolDiagnostics(globalStore[CLIENT_KEY], env);
    return globalStore[CLIENT_KEY];
  }
  if (globalStore[URI_KEY] && globalStore[URI_KEY] !== uri) globalStore[PROMISE_KEY] = undefined;
  globalStore[CLIENT_KEY] = new MongoClient(uri, options);
  globalStore[URI_KEY] = uri;
  attachPoolDiagnostics(globalStore[CLIENT_KEY], env);
  return globalStore[CLIENT_KEY];
}

export async function connectMongo(env = process.env) {
  const client = getMongoClient(env);
  const globalStore = globalThis;
  if (!globalStore[PROMISE_KEY]) {
    globalStore[PROMISE_KEY] = client.connect().catch((error) => {
      globalStore[PROMISE_KEY] = undefined;
      throw error;
    });
  }
  await globalStore[PROMISE_KEY];
  return client;
}

export function getMigrationDatabaseName(env = process.env, explicitName) {
  const name = (explicitName ?? env.MONGODB_DB_NAME)?.trim();
  if (!name) throw new Error("MONGODB_DB_NAME or an explicit --database is required.");
  return name;
}

export async function ensureMigrationIndexes(db) {
  const specs = {
    articles: [
      [{ sanityId: 1 }, { unique: true, name: "sanity_id_unique" }],
      [{ language: 1, slug: 1, publicationState: 1 }, { name: "article_slug_lookup" }],
      [{ language: 1, slug: 1 }, {
        unique: true,
        name: "published_article_slug_unique_per_language",
        partialFilterExpression: { publicationState: "published", slug: { $type: "string" } },
      }],
      [{ language: 1, publicationState: 1, publishedAt: -1 }, { name: "article_listing_by_date" }],
      [{ categorySanityIds: 1, publishedAt: -1 }, { name: "article_category_listing" }],
      [{ tags: 1, publishedAt: -1 }, { name: "article_tag_listing" }],
      [{ animeName: 1, language: 1, publishedAt: -1 }, { name: "article_franchise_listing" }],
    ],
    categories: [
      [{ sanityId: 1 }, { unique: true, name: "sanity_id_unique" }],
      [{ slug: 1 }, { unique: true, sparse: true, name: "category_slug_unique" }],
    ],
    authors: [
      [{ sanityId: 1 }, { unique: true, name: "sanity_id_unique" }],
      [{ slug: 1 }, { unique: true, sparse: true, name: "author_slug_unique" }],
    ],
    animeEntries: [
      [{ sanityId: 1 }, { unique: true, name: "sanity_id_unique" }],
      [{ title: 1 }, { name: "anime_title" }],
    ],
    homepageSettings: [[{ sanityId: 1 }, { unique: true, name: "sanity_id_unique" }]],
    assets: [
      [{ sanityId: 1 }, { unique: true, name: "sanity_id_unique" }],
      [{ sha1: 1 }, { unique: true, name: "sha1_unique" }],
      [{ r2Key: 1 }, { unique: true, name: "r2_key_unique" }],
    ],
    migrationRuns: [
      [{ runId: 1 }, { unique: true, name: "run_id_unique" }],
      [{ sourceSnapshot: 1, startedAt: -1 }, { name: "migration_runs_by_source" }],
    ],
  };
  for (const [collectionName, indexes] of Object.entries(specs)) {
    const collection = db.collection(collectionName);
    for (const [keys, options] of indexes) await collection.createIndex(keys, options);
  }
  return Object.keys(specs);
}

// Future public Mongo-backed reads must go through this helper. Keeping the
// publication predicate here prevents draft slugs from becoming routable.
export async function findPublishedArticles(db, selector = {}, options = {}) {
  return db.collection("articles").find(
    { $and: [selector, PUBLIC_ARTICLE_FILTER] },
    options,
  ).toArray();
}

export async function closeMongo(client) {
  if (!client) return;
  await client.close();
  const globalStore = globalThis;
  globalStore[CLIENT_KEY] = undefined;
  globalStore[URI_KEY] = undefined;
  globalStore[PROMISE_KEY] = undefined;
}
