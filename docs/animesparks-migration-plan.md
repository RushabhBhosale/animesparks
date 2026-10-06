# AnimeSparks content platform migration plan

**Phase:** 1 — discovery and design only  
**Snapshot inspected:** Sanity export `sanity-export/production-export-2026-10-05t06-46-44-794z/`  
**Date:** 2026-10-05

This report describes the current application and export, and proposes a migration design. It does not change the Sanity integration, routes, content, hosting, MongoDB, or R2. No database or object-storage writes were made.

## Executive summary and decisions

- Keep Sanity as the production source of truth until a separately approved cutover. Phase 2 should first import into an isolated MongoDB database and R2 bucket, then compare the new read model against Sanity without changing public rendering.
- Use one `articles` collection for `post` and `spanishPost`, with `language`, `sanityType`, and `translationOfSanityId`. This fits the existing shared detail renderer and language-aware lookup while retaining the different source fields and Spanish fallback semantics. Preserve the original `_type` and `_id`; do not flatten away Sanity's distinctions.
- Import every source document, including drafts. Use the full original Sanity document ID as `sanityId` (including the `drafts.` prefix) and track publication state separately. The export has five English draft records, two sharing slugs with published records and three without published counterparts. A unique index over every article slug would therefore reject valid source records.
- Store category, author, homepage-settings, anime-list, asset and migration-run records in their own collections. Keep references as stable `sanityId` values, and resolve them in the read layer. Preserve unresolved references as source data and report them; do not silently drop them. The subscriber record is excluded from Phase 2 by the user's decision.
- Mirror all 578 images into R2 under deterministic keys derived from Sanity asset ID/SHA-1, and store a manifest in MongoDB. Keep the original Sanity asset ID, hash, filename, dimensions and current asset URI for traceability. The 569 image nodes in the document export point to local export files through `_sanityAsset`, rather than using the usual expanded `asset._ref` shape.
- Treat the approximately 795K ISR writes, 429K ISR reads, and 941K CDN requests as symptoms to investigate with Vercel path and time breakdowns. The current 60-second route revalidation and fully pre-rendered article slugs are likely contributors; repository evidence alone cannot attribute the counts or quantify each cause.

## Current architecture

- Next.js App Router 16.1.6, React 19, TypeScript, Tailwind. Content is fetched on the server through `next-sanity`; `@portabletext/react` renders Portable Text. Existing public routes are English `/blog/[slug]` and Spanish `/es/blog/[slug]`.
- Sanity project configuration is read in `sanity/lib/client.ts`; the production query client uses `useCdn: false`. The app has an embedded Sanity Studio at `/studio` and Sanity schema/action code under `sanity/`.
- The public site reads content from GROQ in `sanity/blogQueries.ts`, plus direct GROQ strings in search and the ChatGPT publishing integration. Current image URLs are built using `@sanity/image-url` and `cdn.sanity.io`.
- The ChatGPT integration has a Sanity-backed repository in `lib/integrations/chatgpt/sanity.ts`; it reads raw perspectives, creates drafts, creates/replaces review drafts and reads draft/published documents. The publish API route publishes an identified draft and calls `revalidatePath` on relevant site routes.
- Other Sanity write-capable code is present in `sanity/lib/writeClient.ts` (client configuration) and the AniList import/SEO scripts. No Phase 1 changes were made to these paths.
- Sanity schemas registered in `sanity/schemaTypes/index.ts`: `post`, `spanishPost`, `animeEntry`, `category`, `author`, `homepageSettings`, and the reusable `blockContent` array. The export contains an additional `subscriber` document type that is not registered in this schema list.
- The export contains 388 content documents and 578 assets. The `images/` directory has 578 files (about 588 MB); `files/` is empty. Do not treat the user-provided inventory count of 578 assets as 578 content documents.

### Code areas that query or mutate Sanity

Public read/query paths found:

- `app/page.tsx`, `lib/trending.ts` — homepage picks, latest posts, anime clusters, trending source list.
- `app/(main)/blogs/page.tsx`, `app/(main)/blogs/es/page.tsx` — English and Spanish archives and categories.
- `app/(main)/blog/_lib/blog-post-page.tsx` — shared English/Spanish post reads, slug enumeration, franchise and related-article reads, plus metadata and structured-data inputs.
- `app/(main)/categories/page.tsx`, `app/(main)/categories/[slug]/page.tsx`, `app/(main)/tags/[tag]/page.tsx`, `app/(main)/trending/page.tsx` — taxonomy and editorial listing reads.
- `app/(main)/search/page.tsx`, `app/api/search/route.ts` — search document query / search result hydration.
- `app/(main)/my-anime-list/page.tsx` — anime entries.
- `app/(main)/sitemap/page.tsx`, `app/sitemap.xml/route.ts`, `app/rss.xml/route.ts` — visible/XML sitemap and RSS feeds.
- `lib/integrations/chatgpt/sanity.ts` — integration content-context, post lookup and editorial references.
- Query definitions are centralized mostly in `sanity/blogQueries.ts`; its publish-date predicates hide future-dated posts from public queries. Spanish listing/detail projections use `coalesce` fallbacks to the original English post for publication date, author, tags, image, categories, and in some detail queries anime metadata, sources and update history.

Write paths found:

- `lib/integrations/chatgpt/sanity.ts`: Sanity `create`, `createOrReplace`, `getDocument`, plus reads of raw documents. API routes are under `app/api/integrations/chatgpt/`.
- `app/api/integrations/chatgpt/blog-drafts/[id]/publish/route.ts`: publishes a selected draft through the service/repository path and revalidates `/`, `/blogs`, `/sitemap.xml`, `/rss.xml`, and the English `/blog/{slug}` route.
- `scripts/import-anime-list.cjs`, `scripts/fetch-anilist-bulk.cjs`, and `scripts/apply-seo-growth-day-1-60.cjs`: Sanity-token-backed script paths that can import or mutate Sanity. They were inspected as code only; not run.
- `sanity/lib/writeClient.ts` declares a write-token client, but no public-site direct use of that exported client was found.

## Sanity schemas and exported document inventory

The counts below are from parsing each line of `data.ndjson`. They include drafts as separate documents.

| Sanity type | Count | Schema fields / exported shape | Main relationships and notes |
|---|---:|---|---|
| `post` | 235 | `title`, `slug.current`, `excerpt`, `animeName`, `articleType`, `metaTitle`, `metaDescription`, `author`, `tags`, `mainImage`, `categories`, `publishedAt`, `updatedAt`, `updateHistory[]`, `body`, `primaryKeyword`, `secondaryKeywords[]`, `internalLinks[]`, `sources[]`, `faq[]`, `viewCount`, `integrationCreatedAt`; export-only `seoTitle` appears on 4 records. | Reference to `author`; references to `category[]`; inline image assets in `mainImage` and Portable Text. Five draft IDs (two have published counterparts). |
| `spanishPost` | 13 | `originalPost`, `title`, `slug.current`, `excerpt`, `metaTitle`, `metaDescription`, `author`, `tags`, `mainImage`, `categories`, `publishedAt`, `updatedAt`, `body`, `faq[]`, `viewCount`. Several optional fields may be inherited from `originalPost`. | All 13 exported records have an `originalPost` reference; 12 explicit authors and 11 explicit category lists; optional image/tag/date/etc. fallback in current GROQ. |
| `animeEntry` | 131 | `title`, numeric `score`, URL strings `coverImage` and `bannerImage`, `genres[]`, `year`; Sanity system metadata. | No Sanity document references. Images are URL strings in the schema, not Sanity image fields. |
| `category` | 6 | `title`, `slug.current`, `description`; Sanity system metadata. | Posts reference categories; current query resolves category data and computes counts/covers. |
| `author` | 1 | `name`, `slug.current`, `image`, Portable Text `bio`; Sanity system metadata. | Referenced by posts and optionally Spanish posts; Spanish queries inherit English author where the Spanish author is absent. |
| `subscriber` | 1 | Export has `email`, `source`, `status`, `subscribedAt` and Sanity system metadata. | No matching schema registration found. Handle as a separate user-data import with explicit access/privacy controls. |
| `homepageSettings` | 1 | `title`, `editorsPicks[]`, `moreBlogs[]`; Sanity system metadata. | References to posts; export has 4 editor picks and 6 more-blogs entries. The Studio schema allows up to 6 and 12 respectively. |

Sanity system fields observed: `_id`, `_type`, `_rev`, `_createdAt`, `_updatedAt`; `_system` appears on some post/category/homepage/Spanish records and holds version-base metadata (for example `{ base: { id, rev } }`). Preserve these in `sourceMetadata` for migration/debugging, or preserve their raw source document in an audit field. `_rev` is source provenance, not a MongoDB concurrency token. `drafts.{uuid}` is an actual source ID and must not be canonicalized to the published ID during import.

### Schema versus export drift and draft handling

- The actual data has missing optional content: `post.excerpt` is present on 154/235; `animeName` and `articleType` each on 149; `primaryKeyword` on 159; `tags` on 194; `categories` and `author` on 228. `spanishPost.excerpt` is present on 12/13. Read models must preserve the same fallback and null behavior as current GROQ.
- `post.seoTitle` is not in the declared schema but appears on four exported posts. `metaTitle` exists on 234/235 English posts and all 13 Spanish posts. Preserve both raw fields; the current article UI reads `metaTitle` and then `title`, not `seoTitle`.
- `subscriber` is present in the export but absent from the registered schema. Its origin, intended owner, consent history and retention policy are unknown and need product/security confirmation before exposing it in a publishing API.
- Five `post` source records have IDs starting with `drafts.`. Two share a slug with the published document of the same base ID: `kagurabachi-anime-release-date` and `dragon-ball-super-beerus-release-date-october-11-2026`. Three are draft-only (`maomao-jinshi-relationship-apothecary-diaries-explained`, `my-happy-marriage-special-episodes-release-date-netflix`, `blue-box-season-2-release-date-netflix`). Keep all five out of public indexes until explicitly published.
- The complete export has no weak references. All document reference targets found in author/category/original-post/homepage fields resolve to an exported document. Asset links use `_sanityAsset` local file URIs rather than ordinary `_ref` entries, so generic reference validation will not validate images.
- Two English slug values occur twice only because each has a draft and published version. No duplicate Spanish slug values were found. There is no exported explicit canonical or noindex value.

## Portable Text, custom blocks and asset references

`blockContentType.ts` permits blocks with normal/H1/H2/H3/H4/blockquote styles, bullet/number lists, `strong`/`em` decorators and `link` annotations (`href`). It also permits image nodes with `alt`, `sourceUrl`, `sourcePage`, `hostedUrl`, `imagePurpose`, `insertAfterHeading`, hotspot/crop data and Sanity asset references. The export also contains arrays/objects named `faqItem`, `articleSource`, `articleUpdate`, and `internalLink`, as well as Sanity `reference` and `slug` values; those have their own schemas/field shapes and should remain typed data rather than being treated as Portable Text block types. Preserve Portable Text `_key`, `_type`, mark definitions/keys, style, list metadata, child spans, annotations and order. Do not turn Portable Text into flat HTML/text as the canonical migrated content.

Observed document content has 13,340 Portable Text blocks and 17,774 spans across article bodies and the author bio; 327 inline body image blocks (318 English + 9 Spanish); 598 link mark objects (583 English + 15 Spanish); 836 FAQ objects; 528 sources; 307 internal-link objects; and 27 update-history objects. The application’s custom renderer and any API Markdown conversion both consume article body structure, so retain the original blocks and add derived text/Markdown only as a separately versioned projection if needed.

There are 569 `_sanityAsset` image references in document content, representing 540 distinct local file URIs. `assets.json` is a map of 578 `image-{sha1}` asset IDs to metadata records. Those records contain `sha1hash`, `originalFilename`, `size`, timestamps/revision and image metadata (dimensions, aspect ratio, alpha/opacity, blurHash, lqip, palette and thumbnail hash); image bytes are named `{sha1}-{width}x{height}.{extension}` in `images/`. The 578 exported image files total about 588 MB; `files/` is empty. The asset metadata JSON does not contain an R2 URL or original CDN URL.

Proposed R2 mapping:

1. Build a deterministic asset manifest keyed by original Sanity asset ID (for example `image-{sha1}`) and SHA-1; verify file hash against manifest hash before upload.
2. Use immutable keys such as `sanity/{sha1}/{original-export-filename}` (or stable `assets/{sanityAssetId}/{filename}`) and record `r2Key`, `publicUrl`, content type, byte size, dimensions, SHA-1, source filename and original Sanity ID in `assets` collection.
3. Resolve each `_sanityAsset` file URI to its export filename, then SHA-1 / `image-*` record; rewrite only the imported copy into a normalized `{ assetId, alt, crop, hotspot, ... }` shape. Keep original source URI and source fields in the migration record for audit. Missing file, hash mismatch, or unmatched reference must fail validation rather than silently retain a broken image.
4. Preserve `sourceUrl`, `sourcePage`, `hostedUrl`, `imagePurpose`, `insertAfterHeading`, alt, crop and hotspot metadata. `animeEntry.coverImage`/`bannerImage` are external URLs and should remain URLs unless separately approved for mirroring.
5. For parity during shadow reads, generate an asset URL compatible with the current frontend contract. Do not switch image host/config or visible URL behavior until the separate cutover plan explicitly addresses image URLs, redirects/canonical effects and caching.

The 38 assets in the export that are not referenced in document content should still be imported into the asset manifest/R2 or explicitly accounted for in a verified unused-assets report; they may be future CMS uploads. Keep the exact export snapshot checksum and import manifest with Phase 2 evidence.

## SEO, URLs, and current rendering contract

The current SEO contract is partly code, partly Sanity data. Neither canonicals nor robots/noindex flags are present in this export. Preserve route and output behavior from code rather than inventing absent fields.

- **Slug/URL:** English `slug.current` maps to `/blog/{slug}`; Spanish `slug.current` maps to `/es/blog/{slug}`. Spanish `originalPost` supplies the paired English slug when available. Current metadata emits locale alternates and `x-default`; the XML sitemap emits `en`, `es`, `x-default` alternates when paired.
- **Title and description:** article title uses `metaTitle.trim()` or `title`; description uses `metaDescription`, then excerpt/body text fallback. The English GROQ expression for list excerpts also coalesces excerpt/body text; Spanish queries coalesce inherited fields in some reads. Preserve raw optional values and reproduce the exact per-query precedence.
- **Dates/public visibility:** public English article queries require `publishedAt <= now()`. Spanish uses `coalesce(spanishPost.publishedAt, originalPost.publishedAt) <= now()`. Article updated-date display uses explicit `updatedAt`, otherwise Sanity `_updatedAt` only when later than `publishedAt`; sitemap `lastmod` is based on `_updatedAt`. Keep source timestamps separately and normalize timezone-aware values without changing instant/precision.
- **Canonical/indexing:** article metadata currently makes canonical URL from the route helper, sets `robots: index, follow`, and emits Open Graph/Twitter URLs from it. Other search/tag metadata can set `noindex` based on request parameters; preserve existing behavior in the frontend. No per-article `canonical`, `noindex`, `index`, `robots`, `openGraph` or `twitter` source fields were exported.
- **Structured data:** article pages emit Article JSON-LD, BreadcrumbList JSON-LD, and FAQ JSON-LD only when valid FAQ items exist. Fields include canonical URL, title/description, images, dates, author/publisher and `inLanguage`. The body/FAQ/author/image/date projection must remain compatible.
- **Other SEO surfaces:** preserve category titles/slugs/descriptions, taxonomy and internal-link targets, XML sitemap inclusion/date/hreflang rules, visible sitemap, RSS publish/update dates, metadata and robots configuration. Search/listing filters also rely on published-date state. Do not change any frontend route, slug, URL, canonical, metadata, structured-data or sitemap behavior as part of Phase 1.
- **Internal links:** `internalLinks[]` contains `{ text, url }`; links also occur in Portable Text marks and may reference existing public URLs. Preserve exact strings and do not automatically rewrite or normalize them during data migration.
- **Language relation:** all 13 exported Spanish articles reference an English `post`. Preserve the reference even when translation fields override inherited values; inherited fields should remain query-time fallbacks, matching existing behavior.

## Proposed MongoDB model

Use an application database with seven Phase 2 collections. `_id` can be MongoDB ObjectId; impose stable unique indexes on `sanityId` where applicable. Retain `_type` as `sanityType` and preserve raw source records during the validation period. The `subscribers` collection is intentionally not part of Phase 2.

| Collection | Document contents | Proposed indexes |
|---|---|---|
| `articles` | English and Spanish articles in one collection. `sanityId`, `sanityType`, `language` (`en`/`es`), `publicationState` (`draft`/`published`), `title`, `slug`, optional editorial/SEO fields, dates, Portable Text, FAQs, relations (`authorSanityId`, `categorySanityIds`, `translationOfSanityId`), raw `sourceMetadata`, `sourceSnapshotAt`. Keep source-only values such as `_rev`, `_system`, `seoTitle`, `integrationCreatedAt`, `viewCount`. | Unique `{sanityId: 1}`. Public slug lookup `{language: 1, slug: 1, publicationState: 1}`; enforce unique `{language, slug}` only for `publicationState: "published"` with a partial unique index. Listing `{language, publicationState, publishedAt desc}`; multikey `{categorySanityIds, publishedAt desc}`; multikey `{tags, publishedAt desc}`; optionally `{animeName, language, publishedAt desc}`. Add text/search indexes only after matching current search semantics. |
| `categories` | `sanityId`, `title`, `slug`, `description`, source metadata. | Unique `sanityId`; unique `slug`. |
| `authors` | `sanityId`, `name`, `slug`, bio Portable Text, image reference, source metadata. | Unique `sanityId`; unique sparse `slug`. |
| `animeEntries` | `sanityId`, title, score, external cover/banner URLs, genres, year, source metadata. | Unique `sanityId`; title index. |
| `homepageSettings` | `sanityId`, title, ordered arrays of post `sanityId` references for picks and more-blogs; source metadata. | Unique `sanityId`; singleton selection by `sanityId` (do not assume a title value is the ID). |
| `assets` | `sanityId`, `sha1hash`, `r2Key`, `publicUrl`, original filename, MIME type, size, dimensions/metadata, current export filename, source timestamps/revision. | Unique `sanityId`; unique `sha1hash`; unique `r2Key`. |
| `migrationRuns` | Deterministic `runId`, source snapshot checksums, source/target counts, transform version, start/end time, status, skipped IDs and failure summary. | Unique `runId`; `{sourceSnapshot, startedAt}` for audit lookup. |

`articles` should keep the English and Spanish source field shapes distinct inside one shared collection: `spanishPost` has optional translated overrides and `originalPost` inheritance. Store explicit translated values as authored; implement the same fallback at read time rather than copying inherited values into source fields. Add a compatibility projection in the publishing/data layer matching each current GROQ projection. Do not index draft slugs as globally unique because source draft/live versions can collide.

All public listing queries need explicit publication-state and publish-time predicates equivalent to current GROQ. A migration-only source `sanityId` must never become a public URL, identifier, or frontend-visible metadata field.

## Proposed internal publishing API

Keep the API server-only and separate from public site read paths. Use a repository interface under `lib/` so the existing Sanity repository can continue serving production while a Mongo repository is introduced behind explicit environment/deployment selection in a later phase. The internal API should validate request bodies with versioned schemas, authenticate publishing actions, enforce draft/review/publish transitions, preserve idempotency keys, and perform audit logging. Use `sanityId` only as a migration/debugging linkage; new documents should receive an independent stable application ID.

Suggested internal resources: article draft create/update/read, explicit publish/unpublish, content context/search, category/author lookup, and asset upload/signing. A content write should increment a content revision, record actor/time, and trigger targeted revalidation after durable commit. Keep secret keys server-only; never expose MongoDB or R2 credentials to browser bundles. The exact publisher auth token can remain `BLOG_PUBLISH_KEY` for API compatibility if desired, but the API contract should not depend on Sanity ID formatting or draft document names.

## Caching and Vercel usage findings

Observed code configuration:

- `revalidate = 60` is set on the home page, both article routes, English/Spanish listing pages, categories and category detail, tag detail, trending, visible sitemap, and anime-list route. XML sitemap and RSS use 3600 seconds. Search and publishing integration API routes are force-dynamic.
- `generateStaticParams()` obtains every public post slug for both locales. It therefore builds known article paths ahead of time; the dynamic routes then carry a 60-second revalidation policy. Newly introduced paths can still be generated on demand.
- Some route helpers wrap Sanity fetches with React `cache()` (`getPost`, slug enumeration, franchise list, category, tag posts). This deduplicates within the relevant render/request work; it is not a shared distributed content cache. Several pages issue multiple independent GROQ requests. `useCdn: false` is set on the shared Sanity client.
- Article detail rendering can make the primary post query, franchise query, related query, metadata resolution, and slug enumeration; homepage fetches multiple queries and calls Google Analytics/token APIs for trending information. Runtime revalidation and request patterns can therefore amplify backend work.
- The publish route explicitly revalidates only selected paths. Its listed calls include the English article path but not a Spanish article path, category/tag pages, or all pages influenced by a published document. The ISR metric totals alone cannot confirm whether this caused the reported costs, and this report does not alter it.

Likely explanations for the approximate metrics:

1. **ISR writes (~795K):** the 60-second revalidation interval across popular pages and a large pre-rendered route set likely causes frequent regeneration over the reporting window. Traffic-triggered ISR can regenerate after expiration; each route/path and deployment/region behavior may affect counts. Confirm metric definition and time range with Vercel analytics.
2. **ISR reads (~429K):** served responses may read cached route/data entries; count is affected by request volume, cache-hit behavior, route variants, deployment regions and the period measured. Query requests made to Sanity are a separate cost surface from Vercel ISR reads.
3. **CDN requests (~941K):** likely mostly incoming page, image and static-asset requests from visitors/crawlers, potentially with route/asset repetition. This figure cannot be derived from repository settings; CDN path/status breakdown and bot traffic are needed.

The next validation step should correlate Vercel metrics by date, path, cache status, region and deployment with route request logs and Sanity request volume. The 60-second TTL is an obvious investigation target, but do not change it until the production migration plan is approved and SEO freshness requirements are agreed.

## Environment variables

Names already read by this codebase (values were not inspected): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_WRITE_TOKEN`, `BLOG_PUBLISH_KEY`, `NEXT_PUBLIC_SITE_URL`, `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY`.

Proposed variables for a future MongoDB/R2 deployment (exact names are a recommendation, not existing configuration):

| Variable | Use | Exposure |
|---|---|---|
| `MONGODB_URI` | Atlas connection URI, including TLS/authentication. Use separate least-privilege credentials per environment. | Server only |
| `MONGODB_DB_NAME` | Target application database name. | Server only |
| `MONGODB_MAX_POOL_SIZE` | Optional explicit driver pool limit after measuring serverless concurrency. | Server only; optional |
| `R2_ACCOUNT_ID` | Cloudflare account for the S3-compatible endpoint. | Server only |
| `R2_ACCESS_KEY_ID` | Scoped R2 access key. | Server only |
| `R2_SECRET_ACCESS_KEY` | R2 secret key. | Server only |
| `R2_BUCKET_NAME` | Target bucket, with separate migration/staging and production buckets. | Server only |
| `R2_S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` endpoint for S3-compatible SDK. | Server only |
| `R2_PUBLIC_BASE_URL` | Public asset base URL/custom domain used by server rendering. | Server config; public URL itself may be visible |
| `R2_REGION` | S3 SDK region; use the value required by the selected SDK/R2 compatibility mode (commonly `auto`). | Server only |
| `INTERNAL_PUBLISH_API_TOKEN` | Optional replacement for or alias of `BLOG_PUBLISH_KEY` for the future publisher API. | Server only |

The existing Sanity variables remain needed while Sanity serves production. Do not remove them during shadow import or validation. Keep site URL and analytics variables independent from the content-store migration. Confirm whether Phase 2 reuses `BLOG_PUBLISH_KEY` or introduces the new token name before deploying API changes.

## Idempotent migration script design (Phase 2 proposal)

Implement as an explicit CLI with dry-run as the default and explicit target selection. It should not be part of a build or deploy hook.

1. Read a named, immutable export directory; parse NDJSON line by line and `assets.json`. Validate JSON, expected type counts, unique original IDs, known schema/field shapes, and export checksum. Record a run ID and source snapshot timestamp.
2. Normalize each document without deleting fields: preserve `sanityId = _id`, `sanityType = _type`, source timestamps, `_rev`, `_system`, all optional/unrecognized fields in `sourceMetadata`/raw payload, explicit `publicationState` from `drafts.` prefix, locale, and a deterministic transform version. Do not treat `publishedAt` alone as proof the Sanity document is published; draft documents can also have a publish date.
3. Transform references into stable `sanityId` fields without dropping `_weak` or original reference objects. Resolve references in a second pass; reject missing strong targets and report any weak/unresolved ones. Preserve array order and duplicates if present.
4. For images, map every `_sanityAsset` URI to a local file and asset manifest row; verify SHA-1; create a planned manifest first. Upload with deterministic R2 keys and content type using conditional/overwrite-safe semantics; verify object size/hash after upload. Re-running the same input writes the same keys and does not create duplicate assets. A changed file with the same ID/hash is a hard error.
5. Upsert Mongo documents by `sanityId` using deterministic replacements or versioned `$set` of migration-owned fields. Keep app-authored fields separate from import-owned source fields if a later dual-write period exists. Do not derive IDs from slugs. Preserve duplicate slugs in draft records.
6. Validate counts by source type/state, IDs, reference closure, exact slug/language mapping, Portable Text node counts/order, all asset-reference coverage, hashes/bytes, dates, optional SEO values, and unknown fields. Produce machine-readable `migration-manifest.json` and human-readable report with skipped/failed IDs. Exit nonzero on any required mismatch.
7. Support `--dry-run`, `--verify-only`, explicit `--source`, `--database`, `--bucket`, and an opt-in `--apply`; never read target names from an ambiguous production default. A rerun uses the same source snapshot plus upserts and immutable asset keys. Use a run lock or database migration-run record to prevent overlapping writes.

## Migration phases

1. **Phase 1 — discovery/design (this report):** inspect code/export, document mapping and risks. No production integration edits or data writes.
2. **Phase 2 — isolated import tooling:** add Mongo/R2 clients, schemas, dry-run importer, validators and sample import to a non-production database/bucket. Keep current Next.js reads and Sanity CMS writes unchanged.
3. **Phase 3 — content verification:** import the full snapshot, compare representative/all rendered data and SEO outputs against Sanity, check every reference/image, preserve draft access rules, and test API behavior in a staging deployment. Use route/metadata/sitemap/RSS parity checks.
4. **Phase 4 — shadow reads:** query Mongo in a non-user-facing comparison path or preview deployment. Log mismatches without changing production output. Agree on acceptable parity and cache policy using observed traffic and Vercel metrics.
5. **Phase 5 — controlled read cutover:** switch selected server-side repositories/preview deployment first, then production by a reversible feature flag or deployment alias. Keep Sanity available and unchanged as rollback source. Monitor SEO routes, errors, query latency, image delivery, API load and cache metrics.
6. **Phase 6 — publishing cutover:** only after stable reads, route content writes to the new publishing API. Decide whether to freeze Sanity writes or maintain a temporary one-way/dual-write process; prevent conflicting writers and reconcile changes since the export snapshot.
7. **Phase 7 — retirement and hosting decision:** after an agreed observation/rollback window and successful backup/restore exercise, separately decide when to decommission Sanity and whether to migrate hosting. Hosting migration is a distinct project and is outside this plan's implementation scope.

## SEO preservation checklist for later phases

- [ ] Exact public route paths, slugs and trailing-slash behavior remain the same for every published article and static route.
- [ ] No post becomes visible or indexable solely because the importer inferred publish status from `publishedAt`; draft state comes from the source ID/publishing state.
- [ ] Article title/meta-title fallback, description/excerpt/body fallback and Spanish inherited-field precedence match each existing query.
- [ ] Canonical URL and language alternates, `x-default`, robots directives and Open Graph/Twitter values match current output.
- [ ] Article, breadcrumb and conditional FAQ JSON-LD match current values and URLs.
- [ ] Published/update dates preserve timezone, precision, display rules, JSON-LD values, RSS and sitemap `lastmod` behavior.
- [ ] XML sitemap and visible sitemap contain the same eligible routes; paired Spanish/English hreflang remains symmetric as currently defined.
- [ ] Category slugs/counts/covers, tags, internalLinks, Portable Text links, RSS and search behavior retain existing URLs and inclusion rules.
- [ ] All Sanity image references resolve to the correct visual image with existing alt/hotspot/crop/custom metadata and no broken-image responses.
- [ ] Existing redirects and any route aliases stay unchanged; no canonical or indexability changes are bundled into the data-store switch.
- [ ] Compare representative and exhaustive route metadata/output before cutover; preserve a dated baseline and response captures.

## Rollback strategy

- During Phase 2–4, rollback means stop the importer/shadow comparison. The application still reads Sanity and no production content path has changed. Remove or retain isolated test DB/bucket data according to their lifecycle policy; this does not affect Sanity.
- During read cutover, immediately route the feature flag/deployment alias back to the Sanity repository. Keep Mongo read-only until discrepancies are understood. Retain the last known-good deployment and export snapshot.
- During publishing cutover, define one authoritative writer before switching. To roll back safely, freeze writes briefly, export/reconcile Mongo changes created after cutover back to the Sanity-compatible shape, validate IDs/references/assets, then restore Sanity writes and read routing. Never blindly replay a stale full snapshot over newer content.
- Keep R2 assets immutable and Mongo source fields intact through the rollback window. Record run IDs, content revisions and write audit events so changes after the snapshot can be reconciled.
- Restore hosting independently from content storage. Do not couple a Vercel-to-Cloudflare hosting change to the Mongo/R2 data cutover.

## Risks and unresolved mapping questions

1. **Subscriber provenance:** one exported subscriber contains personal data but there is no declared schema or matching application model. Confirm consent/provenance, intended use, retention, security and whether this record should be migrated before import.
2. **Draft conflict/publishing state:** preserve five draft documents and their IDs distinctly from published records; confirm which roles/API paths need draft access in the new system.
3. **Asset identifier extraction:** export uses local `_sanityAsset` URIs while `assets.json` keys use `image-{sha1}` and files use SHA-1/dimension names. Import tooling must explicitly validate the URI filename/hash mapping; no direct R2 URLs are supplied.
4. **Asset availability/rights:** there are 38 unreferenced export images; preserve/account for them, and verify the asset source/licensing/usage metadata is sufficient for continued use. `sourceUrl`/`sourcePage` only exist as optional custom fields.
5. **Unmodeled fields:** `seoTitle`, `_system`, Sanity metadata and possibly other future-added fields are not fully described by the current schema. Preserve unknown fields and do not discard them in a typed conversion.
6. **No explicit canonical/index policy in CMS:** current SEO directives are generated in code. If the new publishing API later requires per-document overrides, treat that as a product/schema change, not a migration default.
7. **Translations are partial overrides:** the 13 Spanish entries can inherit selected data from English content. Copying fallback values would lose whether a Spanish field was explicitly authored and could change behavior after future updates.
8. **Search equivalence:** current search uses Fuse plus GROQ hydration and filtering. Mongo text/Atlas Search is not automatically equivalent; its ranking, locale handling and result caps require parity design.
9. **Cache/cost attribution:** the supplied approximate Vercel metrics lack reporting window, route breakdown and metric definitions. The report identifies likely contributors but cannot prove root cause. Verify using Vercel analytics before deciding cache duration/invalidation design.
10. **Public image URL strategy:** a host change can change image URLs in Open Graph and potentially cached pages. Keep source URLs and verify that any new R2 domain will not alter page URLs, metadata or perceived frontend output during shadow and later cutover.
11. **Concurrent content changes:** the export is a point-in-time snapshot. Before any production cutover, identify changes made after export and create a delta/reconciliation plan.

## Phase 2 decisions and implementation status

The user-approved Phase 2 decisions are: skip subscribers; use one `articles` collection for English and Spanish; preserve Spanish overrides and resolve English fallbacks without copying them; import all drafts but filter public reads by `publicationState`; retain `BLOG_PUBLISH_KEY`; use staging-only MongoDB/R2 targets; keep Sanity as production source of truth; leave `revalidate = 60`, hosting, routes and frontend unchanged; and preserve unknown source fields.

The Phase 2 importer and validation tooling has been implemented. A full dry-run against the named export validated 388 source records (387 transformed, one subscriber intentionally skipped) and 578 image assets. It found five drafts, zero missing references, zero asset hash/size errors, zero warnings and zero validation errors. No MongoDB or R2 writes were performed. The generated artifacts are under `migration-artifacts/ad24dce1883f77410c065aa3/`.

Before any later `--apply`, staging Atlas/R2 resources and private credentials must be provisioned; the CLI requires explicit database/bucket names marked as staging and refuses production-like target names. Vercel metric breakdowns and a post-snapshot content reconciliation plan remain needed before a future cutover. Phase 3 has not been started.

## Inspected source locations

Schema definitions: `sanity/schemaTypes/*.ts`; queries: `sanity/blogQueries.ts`; clients: `sanity/lib/{client,writeClient,live,image}.ts`; editorial rendering/metadata: `app/(main)/blog/_lib/blog-post-page.tsx`; caching and public query sites listed above; publishing repository/API under `lib/integrations/chatgpt/` and `app/api/integrations/chatgpt/`; sitemap and RSS at `app/sitemap.xml/route.ts` and `app/rss.xml/route.ts`; export JSON at the snapshot directory noted at the top.
