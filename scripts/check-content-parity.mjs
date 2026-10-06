import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "next-sanity";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { connectMongo, getMigrationDatabaseName, findPublishedArticles } from "../lib/migration/mongodb.mjs";
import { canonical, findImageAssetReferences, normalizePortableTextAssets, structuralDiff } from "../lib/migration/parity.mjs";

loadEnvConfig(process.cwd());
const outputDir = path.resolve(process.env.PHASE3_REPORT_DIR || "migration-artifacts/phase3-parity");
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
});

const effective = (doc, original) => ({
  ...doc,
  publishedAt: doc.publishedAt ?? original?.publishedAt,
  tags: doc.tags ?? original?.tags,
  sources: doc.sources ?? original?.sources,
  updateHistory: doc.updateHistory ?? original?.updateHistory,
  updatedAt: doc.updatedAt ?? original?.updatedAt,
  animeName: doc.animeName ?? original?.animeName,
  articleType: doc.articleType ?? original?.articleType,
  mainImage: doc.mainImage ?? original?.mainImage,
  categories: doc.categories ?? original?.categories,
  author: doc.author ?? original?.author,
});
async function main() {
  const report = { generatedAt: new Date().toISOString(), database: process.env.MONGODB_DB_NAME, status: "blocked", checks: {}, mismatches: [], blockers: [] };
  let mongo;
  try {
    if (process.env.MONGODB_DB_NAME !== "animesparks_staging") throw new Error("Parity checker is restricted to MONGODB_DB_NAME=animesparks_staging.");
    mongo = await connectMongo();
    const db = mongo.db(getMigrationDatabaseName());
    const [sanityDocs, mongoDocs, draftDocs, assets] = await Promise.all([
      sanity.fetch(`*[_type in ["post", "spanishPost"] && defined(slug.current) && coalesce(publishedAt, originalPost->publishedAt) <= now()]`),
      db.collection("articles").find({ publicationState: "published" }).toArray(),
      db.collection("articles").find({ publicationState: "draft" }).toArray(),
      db.collection("assets").find({}).toArray(),
    ]);
    const sanityById = new Map(sanityDocs.map((doc) => [doc._id, doc]));
    const mongoById = new Map(mongoDocs.map((doc) => [doc.sanityId, doc]));
    const sourceEn = sanityDocs.filter((d) => d._type === "post");
    const sourceEs = sanityDocs.filter((d) => d._type === "spanishPost");
    const publicEn = mongoDocs.filter((d) => d.language === "en" && d.publicationState === "published");
    const publicEs = mongoDocs.filter((d) => d.language === "es" && d.publicationState === "published");
    const sort = (xs) => xs.map((x) => x.slug?.current ?? x.slug).filter(Boolean).sort();
    const compareFields = ["title", "excerpt", "articleType", "metaTitle", "metaDescription", "publishedAt", "updatedAt", "tags", "sources", "faq", "internalLinks", "body"];
    const bodyDiffSamples = [];
    const bodyRepresentationSamples = [];
    let bodyRepresentationDifferences = 0;
    for (const source of sanityDocs) {
      const migrated = mongoById.get(source._id);
      if (!migrated) { report.mismatches.push({ id: source._id, kind: "missing_mongodb_article" }); continue; }
      const sourceOriginal = source._type === "spanishPost" ? sanityById.get(source.originalPost?._ref) : null;
      const mongoOriginal = migrated.translationOfSanityId ? mongoById.get(migrated.translationOfSanityId)?.sourceDocument : null;
      const expected = source._type === "spanishPost" ? effective(source, sourceOriginal) : source;
      const actual = source._type === "spanishPost" ? effective(migrated.sourceDocument || {}, mongoOriginal) : (migrated.sourceDocument || {});
      for (const field of compareFields) {
        if (field === "body") {
          const rawEqual = canonical(expected.body) === canonical(actual.body);
          const normalizedSanityBody = normalizePortableTextAssets(expected.body);
          const normalizedMongoBody = normalizePortableTextAssets(actual.body);
          const normalizedEqual = canonical(normalizedSanityBody) === canonical(normalizedMongoBody);
          if (!rawEqual) {
            const sample = {
              id: source._id,
              title: source.title,
              kind: normalizedEqual ? "representation_only" : "content_difference",
              differences: structuralDiff(expected.body, actual.body),
            };
            if (normalizedEqual) {
              bodyRepresentationDifferences += 1;
              if (bodyRepresentationSamples.length < 5) bodyRepresentationSamples.push(sample);
            } else {
              report.mismatches.push({ id: source._id, kind: "field:body" });
              if (bodyDiffSamples.length < 5) bodyDiffSamples.push(sample);
            }
          } else if (!normalizedEqual) {
            // Normalization is deliberately one-way and lossless for content;
            // this branch guards against it ever introducing a false mismatch.
            report.mismatches.push({ id: source._id, kind: "field:body" });
          }
          continue;
        }
        if (canonical(expected[field] ?? null) !== canonical(actual[field] ?? null)) {
          report.mismatches.push({ id: source._id, kind: `field:${field}` });
        }
      }
    }
    const assetBySanity = new Map(assets.map((asset) => [asset.sanityId, asset]));
    const assetBySha1 = new Map(assets.filter((asset) => asset.sha1).map((asset) => [String(asset.sha1).toLowerCase(), asset]));
    let refsResolved = 0, refsMissing = 0;
    for (const doc of sanityDocs) for (const ref of findImageAssetReferences(doc)) {
      const asset = (ref.assetId && assetBySanity.get(ref.assetId)) || (ref.sha1 && assetBySha1.get(ref.sha1));
      if (asset?.r2Key) refsResolved++;
      else refsMissing++;
    }
    const drafts = draftDocs.filter((doc) => doc.sanityId?.startsWith("drafts."));
    const leakedDrafts = await findPublishedArticles(db, { language: "en", sanityId: { $in: drafts.map((d) => d.sanityId) } });
    report.checks = {
      englishSlugs: { sanity: sourceEn.length, mongodb: publicEn.length, equal: canonical(sort(sourceEn)) === canonical(sort(publicEn)) },
      spanishSlugs: { sanity: sourceEs.length, mongodb: publicEs.length, equal: canonical(sort(sourceEs)) === canonical(sort(publicEs)) },
      spanishRelationships: { checked: sourceEs.length, valid: sourceEs.filter((d) => mongoById.get(d._id)?.translationOfSanityId === d.originalPost?._ref).length },
      comparedFields: compareFields,
      portableText: { articles: sanityDocs.length, mismatches: report.mismatches.filter((x) => x.kind === "field:body").length },
      bodyDiagnostics: {
        normalization: "Migration export _sanityAsset filenames are reconstructed as full Sanity image asset IDs including hash, dimensions, and format; all other Portable Text structure remains strict.",
        representationOnlyDifferences: bodyRepresentationDifferences,
        normalizedMismatchCount: report.mismatches.filter((x) => x.kind === "field:body").length,
        samples: [...bodyDiffSamples, ...bodyRepresentationSamples].slice(0, 5),
      },
      drafts: { migratedDrafts: drafts.length, publicQueryLeaks: leakedDrafts.length, expected: 5 },
      imageMappings: { referenced: refsResolved + refsMissing, resolved: refsResolved, missing: refsMissing },
      representativeValidationRequired: ["homepage", "10 English articles", "13 Spanish articles", "body-image article", "FAQ article", "sources article", "category", "tag", "anime listing", "sitemap", "RSS"],
    };
    if (drafts.length !== 5) report.mismatches.push({ kind: "draft_count", expected: 5, actual: drafts.length });
    if (leakedDrafts.length) report.mismatches.push({ kind: "draft_public_read_leak", ids: leakedDrafts.map((d) => d.sanityId) });
    if (refsMissing) report.mismatches.push({ kind: "missing_asset_mapping", count: refsMissing });
    report.status = report.mismatches.length ? "mismatch" : "passed";
  } catch (error) {
    report.blockers.push({ message: error instanceof Error ? error.message : String(error) });
  } finally {
    await mongo?.close();
  }
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "parity-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const lines = ["# AnimeSparks Phase 3 content parity", "", `- Status: **${report.status}**`, `- Generated: ${report.generatedAt}`, `- MongoDB database: ${report.database || "unset"}`, "", "## Checks", ...Object.entries(report.checks).map(([name, value]) => `- ${name}: ${JSON.stringify(value)}`), "", "## Mismatches", ...(report.mismatches.length ? report.mismatches.map((item) => `- ${JSON.stringify(item)}`) : ["- None recorded"]), "", "## Blockers", ...(report.blockers.length ? report.blockers.map((item) => `- ${item.message}`) : ["- None"]), ""];
  await writeFile(path.join(outputDir, "parity-report.md"), lines.join("\n"));
  console.log(`Phase 3 parity status: ${report.status}; reports: ${outputDir}`);
  if (report.status !== "passed") process.exitCode = 1;
}

await main();
