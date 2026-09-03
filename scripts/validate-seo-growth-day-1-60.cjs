/* Read-only verification for the Days 1-60 AnimeSparks SEO migration. */

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("next-sanity");

for (const line of fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
  perspective: "published",
});

const statusSlugs = [
  "blue-lock-season-3-the-neo-egoist-league-arc-explained",
  "frieren-season-3-release-date-golden-land-arc-macht",
  "the-apothecary-diaries-season-3-release-date",
  "one-piece-elbaph-arc-release-date-story-setup-and-why-it-matters",
  "oshi-no-ko-season-3-release-date-and-crunchyroll-schedule-for-2026",
  "oshi-no-ko-season-4-release-date-final-season",
  "solo-leveling-beyond-the-system-release-date",
  "one-piece-film-god-valley-release-date-rocks-roger-garp",
  "when-is-black-clover-season-2-coming-back-latest-news-and-expectations",
  "spy-x-family-season-4-release-date",
  "is-demon-slayer-ending-soon-what-the-manga-timeline-suggests",
  "dandadan-season-3-release-date-2027",
  "jujutsu-kaisen-season-4-release-date-culling-game-part-2",
  "re-zero-season-4-explained-subaru-next-arc",
];

const evergreenSlugs = [
  "why-frieren-hides-her-mana",
  "who-is-jinshi-apothecary-diaries-true-identity",
  "solo-leveling-monarchs-explained",
  "how-does-asta-anti-magic-work-black-clover",
  "how-does-subaru-return-by-death-work-re-zero",
  "demon-slayer-mark-explained-powers-curse",
  "jujutsu-kaisen-heavenly-restriction-explained",
  "dandadan-evil-eye-jiji-possession-explained",
  "every-chainsaw-man-devil-contract-explained",
];

function extractInternalSlug(href) {
  if (typeof href !== "string") return null;
  try {
    const url = new URL(href, "https://www.animesparks.blog");
    const match = url.pathname.match(/^\/blog\/([^/]+)\/?$/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function main() {
  const posts = await client.fetch(`*[_type == "post" && defined(slug.current)]{
    _id,
    "slug": slug.current,
    animeName,
    articleType,
    primaryKeyword,
    metaTitle,
    metaDescription,
    sources,
    updateHistory,
    body[]{markDefs[]{href}}
  }`);
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const inbound = new Map(posts.map((post) => [post.slug, []]));
  const broken = [];
  const selfLinks = [];

  for (const post of posts) {
    for (const block of post.body || []) {
      for (const mark of block.markDefs || []) {
        const destination = extractInternalSlug(mark.href);
        if (!destination) continue;
        if (destination === post.slug) selfLinks.push(post.slug);
        if (!bySlug.has(destination)) broken.push({ from: post.slug, href: mark.href });
        else inbound.get(destination).push(post.slug);
      }
    }
  }

  const missingStatusFields = statusSlugs.filter((slug) => {
    const post = bySlug.get(slug);
    return !post || !post.animeName || !post.articleType || !post.primaryKeyword || !post.metaTitle || !post.metaDescription || !post.sources?.length || !post.updateHistory?.length;
  });
  const missingEvergreenFields = evergreenSlugs.filter((slug) => {
    const post = bySlug.get(slug);
    return !post || !post.animeName || !post.articleType || !post.primaryKeyword || !post.metaTitle || !post.metaDescription || !post.updateHistory?.length;
  });
  const highValueInbound = Object.fromEntries(
    [
      "why-frieren-hides-her-mana",
      "who-is-jinshi-apothecary-diaries-true-identity",
      "solo-leveling-monarchs-explained",
      "how-does-asta-anti-magic-work-black-clover",
      "how-does-subaru-return-by-death-work-re-zero",
      "demon-slayer-mark-explained-powers-curse",
      "jujutsu-kaisen-heavenly-restriction-explained",
      "dandadan-evil-eye-jiji-possession-explained",
      "chainsaw-man-four-horsemen-explained",
      "what-does-ego-mean-in-blue-lock",
    ].map((slug) => [slug, inbound.get(slug)?.length || 0]),
  );

  const report = {
    publishedPosts: posts.length,
    internalLinks: [...inbound.values()].reduce((total, links) => total + links.length, 0),
    remainingOrphans: posts.filter((post) => inbound.get(post.slug).length === 0).map((post) => post.slug).sort(),
    brokenInternalLinks: broken,
    selfLinks: [...new Set(selfLinks)],
    missingStatusFields,
    missingEvergreenFields,
    highValueInbound,
  };
  console.log(JSON.stringify(report, null, 2));
  if (broken.length || selfLinks.length || missingStatusFields.length || missingEvergreenFields.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
