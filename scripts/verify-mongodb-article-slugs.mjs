import { MongoClient } from "mongodb";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMigrationDatabaseName } from "../lib/migration/mongodb.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);

const slugs = process.argv.slice(2);
if (slugs.length !== 3) {
  console.error("Pass exactly three English article slugs.");
  process.exit(2);
}
if (process.env.CONTENT_SOURCE !== "mongodb") {
  console.error("Set CONTENT_SOURCE=mongodb to run this read-only check.");
  process.exit(2);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing from the environment or local env file.");
  process.exit(2);
}

const client = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 1 });
try {
  await client.connect();
  const collection = client.db(getMigrationDatabaseName(process.env)).collection("articles");
  for (const requestedSlug of slugs) {
    const article = await collection.findOne(
      { language: "en", publicationState: "published", slug: { $eq: requestedSlug, $type: "string" } },
      { projection: { _id: 0, slug: 1, title: 1, sanityId: 1 } },
    );
    console.log(JSON.stringify({
      requestedSlug,
      returnedSlug: article?.slug ?? null,
      title: article?.title ?? null,
      sanityId: article?.sanityId ?? null,
    }));
  }
} catch (error) {
  console.error(`Read-only slug verification failed (${error instanceof Error ? error.name : "unknown error"}).`);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}
