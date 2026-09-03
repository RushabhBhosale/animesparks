/*
 * Controlled, one-off editorial migration for the approved Days 1-60 SEO plan.
 *
 * Run without arguments to inspect the intended mutations. Run with --apply only
 * after reviewing the dry-run summary. This script deliberately updates existing
 * documents only; it never creates a post or changes a slug.
 */

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("next-sanity");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadLocalEnv();

for (const variable of [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "SANITY_WRITE_TOKEN",
]) {
  if (!process.env[variable]) throw new Error(`${variable} is required.`);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
  perspective: "published",
});

const apply = process.argv.includes("--apply");
const updatedAt = "2026-09-03T12:00:00.000Z";

const categoryIds = {
  lists: "22893aa0-efa5-4d02-97ba-f278240e6aba",
  news: "69a5bced-cc68-4c1c-add9-c684519d3a06",
  tv: "979ad5c2-5af1-4a1a-96e8-19ea33eec875",
  opinion: "c0002ecb-6440-4229-b746-510a281b034b",
  review: "f7247c7e-8247-4994-ae5e-b3785ce25406",
};

let keyIndex = 0;
const key = (prefix = "seo") => `${prefix}${++keyIndex}`;
const categoryRef = (id) => ({ _key: key("category"), _type: "reference", _ref: id });
const source = (name, url) => ({ _key: key("source"), _type: "articleSource", name, url });
const update = (summary) => ({
  _key: key("update"),
  _type: "articleUpdate",
  date: updatedAt,
  summary,
});

function paragraph(text) {
  return {
    _key: key("block"),
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: key("span"), _type: "span", marks: [], text }],
  };
}

function heading(text) {
  return {
    _key: key("heading"),
    _type: "block",
    style: "h2",
    markDefs: [],
    children: [{ _key: key("span"), _type: "span", marks: [], text }],
  };
}

function bullet(text) {
  return {
    _key: key("bullet"),
    _type: "block",
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs: [],
    children: [{ _key: key("span"), _type: "span", marks: [], text }],
  };
}

function linkedParagraph(prefix, anchor, href, suffix = "") {
  const markKey = key("link");
  return {
    _key: key("block"),
    _type: "block",
    style: "normal",
    markDefs: [{ _key: markKey, _type: "link", href }],
    children: [
      { _key: key("span"), _type: "span", marks: [], text: prefix },
      { _key: key("span"), _type: "span", marks: [markKey], text: anchor },
      { _key: key("span"), _type: "span", marks: [], text: suffix },
    ],
  };
}

function hasHref(body, href) {
  return body.some((block) =>
    Array.isArray(block.markDefs) && block.markDefs.some((mark) => mark.href === href),
  );
}

function insertAfterHeading(body, headingText, block) {
  if (hasHref(body, block.markDefs?.[0]?.href)) return body;
  const index = body.findIndex(
    (item) =>
      item.style === "h2" &&
      Array.isArray(item.children) &&
      item.children.map((child) => child.text || "").join("").trim() === headingText,
  );
  const insertionIndex = index >= 0 ? index + 1 : Math.min(2, body.length);
  return [...body.slice(0, insertionIndex), block, ...body.slice(insertionIndex)];
}

function statusBody(spec) {
  const blocks = [paragraph(spec.quick), heading("What is officially confirmed")];
  blocks.push(...spec.confirmed.map(bullet));
  blocks.push(heading("What credible reporting says"), paragraph(spec.reported));
  blocks.push(heading("What is expected or inferred"), paragraph(spec.inferred));
  blocks.push(heading("What remains unknown"));
  blocks.push(...spec.unknown.map(bullet));
  if (spec.related) blocks.push(heading("Related reading"), linkedParagraph(...spec.related));
  blocks.push(
    heading("How AnimeSparks will update this page"),
    paragraph(
      "This guide is revised when an official broadcaster, studio, distributor, or rights-holder supplies a substantive update. Until then, an estimate is kept separate from a confirmation.",
    ),
  );
  return blocks;
}

const statusPosts = {
  "blue-lock-season-3-the-neo-egoist-league-arc-explained": {
    title: "Blue Lock Season 3: Neo Egoist League Status & Release Updates",
    excerpt:
      "Blue Lock Season 3 is in production for the Neo Egoist League. Here is what the official announcement confirms, and what still has no release date.",
    metaTitle: "Blue Lock Season 3: Status & Release Updates",
    metaDescription:
      "Blue Lock Season 3 is in production for the Neo Egoist League. See the official status, what is confirmed, and what remains unknown.",
    animeName: "Blue Lock",
    articleType: "release-date",
    primaryKeyword: "Blue Lock Season 3 release date",
    secondaryKeywords: ["Blue Lock Neo Egoist League anime", "Blue Lock Season 3 status"],
    tags: ["Blue Lock", "Blue Lock Season 3", "Neo Egoist League", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [
      source("Blue Lock official anime site", "https://tv.bluelock-pr.com/"),
      source(
        "Blue Lock official continuation announcement",
        "https://tv.bluelock-pr.com/tv2nd/news/1085/",
      ),
    ],
    updateSummary:
      "Replaced unsupported October 2026 release claims with the official in-production status and added first-party sources.",
    body: statusBody({
      quick:
        "Blue Lock Season 3, which adapts the Neo Egoist League, is officially in production. As of September 3, 2026, the official project has not announced a broadcast date, episode count, or international streaming plan.",
      confirmed: [
        "The official site identifies the project as TV Animation BLUELOCK Neo Egoist League.",
        "The continuation is in production after the second television season.",
      ],
      reported:
        "No exact premiere date should be presented as reported unless it is attached to a statement from the production committee, broadcaster, studio, or licensed distributor.",
      inferred:
        "The Neo Egoist League is the announced direction, but a production announcement alone does not establish an October 2026 premiere or a weekly broadcast schedule.",
      unknown: [
        "A Japanese broadcast date and time.",
        "Episode count, staff list, and international streaming service.",
        "How much of the Neo Egoist League the season will cover.",
      ],
      related: [
        "For the idea driving the arc, see our guide to ",
        "what ego means in Blue Lock",
        "/blog/what-does-ego-mean-in-blue-lock",
        ".",
      ],
    }),
  },
  "frieren-season-3-release-date-golden-land-arc-macht": {
    title: "Frieren Season 3 Release Date: Golden Land Arc Confirmed",
    excerpt:
      "Frieren: Beyond Journey’s End Season 3, the Golden Land arc, is officially scheduled for October 2027. Here is what that announcement confirms.",
    metaTitle: "Frieren Season 3 Release Date: October 2027",
    metaDescription:
      "Frieren Season 3 is officially scheduled for October 2027 and will adapt the Golden Land arc. See the confirmed details and remaining unknowns.",
    animeName: "Frieren: Beyond Journey's End",
    articleType: "release-date",
    primaryKeyword: "Frieren Season 3 release date",
    secondaryKeywords: ["Frieren Golden Land arc anime", "Macht Frieren Season 3"],
    tags: ["Frieren", "Frieren Season 3", "Golden Land arc", "Macht", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("Frieren official Season 3 announcement", "https://frieren-anime.jp/news/5417/")],
    updateSummary:
      "Verified the October 2027 Golden Land announcement with the official Frieren site and separated confirmed details from unknowns.",
    body: statusBody({
      quick:
        "Frieren: Beyond Journey’s End Season 3 is officially scheduled to begin in October 2027. The announcement identifies the adaptation as the Golden Land arc, which brings the demon Macht into focus.",
      confirmed: [
        "Season 3 is scheduled for an October 2027 television broadcast in Japan.",
        "The announced story material is the Golden Land arc.",
        "Macht is part of the official Season 3 framing.",
      ],
      reported:
        "The official Season 3 announcement is the source for the October 2027 window. No separate release day is currently attributed here.",
      inferred:
        "The Golden Land label makes Macht central to the coming season, but it does not confirm a precise episode count or where the adaptation will end.",
      unknown: [
        "The exact October premiere date and weekly broadcast slot.",
        "International simulcast services and territory-specific release times.",
        "Episode count and the final chapter range of the adaptation.",
      ],
      related: [
        "Before the season arrives, read our spoiler-aware guide to ",
        "Macht and the Golden Land",
        "/blog/macht-golden-land-explained-frieren-season-3-villain",
        ".",
      ],
    }),
  },
  "the-apothecary-diaries-season-3-release-date": {
    title: "The Apothecary Diaries Season 3 Release Date: October 2, 2026",
    excerpt:
      "The Apothecary Diaries Season 3 is officially set to begin on October 2, 2026 in Japan. Here is the confirmed schedule and what remains unannounced.",
    metaTitle: "Apothecary Diaries Season 3: October 2, 2026",
    metaDescription:
      "The Apothecary Diaries Season 3 begins October 2, 2026 in Japan. See the official confirmation, streaming details, and remaining unknowns.",
    animeName: "The Apothecary Diaries",
    articleType: "release-date",
    primaryKeyword: "The Apothecary Diaries Season 3 release date",
    secondaryKeywords: ["Apothecary Diaries Season 3 October 2 2026", "Kusuriya no Hitorigoto Season 3"],
    tags: ["The Apothecary Diaries", "Apothecary Diaries Season 3", "Maomao", "Jinshi", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [
      source(
        "The Apothecary Diaries official Season 3 announcement",
        "https://kusuriyanohitorigoto.jp/news/2623/",
      ),
    ],
    updateSummary:
      "Verified the October 2, 2026 Japanese premiere with the official site and removed unconfirmed release-schedule assumptions.",
    body: statusBody({
      quick:
        "The Apothecary Diaries Season 3 is officially scheduled to begin in Japan on October 2, 2026. The official announcement also says streaming follows the broadcast, but it does not establish a territory-by-territory international schedule.",
      confirmed: [
        "Season 3 begins on October 2, 2026 in Japan.",
        "The Japanese television broadcast is scheduled for Friday at 11:00 p.m. on Nippon TV’s Friday Anime Night block.",
        "The announcement confirms post-broadcast streaming and a new character voiced by Reina Ueda.",
      ],
      reported:
        "The date and Japanese broadcast information above come from the official series announcement. No unverified split-cour schedule is treated as confirmed here.",
      inferred:
        "A post-broadcast streaming note is not, by itself, a confirmed worldwide simulcast timetable.",
      unknown: [
        "The complete international streaming lineup and release times.",
        "Episode count and any later-cour schedule.",
        "The exact point in the source novels where this season will conclude.",
      ],
      related: [
        "For the court mystery at the center of the series, read ",
        "Jinshi’s true identity explained",
        "/blog/who-is-jinshi-apothecary-diaries-true-identity",
        ".",
      ],
    }),
  },
  "one-piece-elbaph-arc-release-date-story-setup-and-why-it-matters": {
    title: "One Piece Elbaph Arc: Release Schedule & Story Setup",
    excerpt:
      "The One Piece Elbaph arc began on Japanese television on April 5, 2026. Here is the official schedule context and the story questions that remain open.",
    metaTitle: "One Piece Elbaph Arc: Release Schedule & Story Setup",
    metaDescription:
      "The One Piece Elbaph arc began April 5, 2026 in Japan. See the official schedule context, story setup, and what has not been announced.",
    animeName: "One Piece",
    articleType: "news",
    primaryKeyword: "One Piece Elbaph arc release date",
    secondaryKeywords: ["One Piece Elbaph anime", "One Piece April 2026 return"],
    tags: ["One Piece", "Elbaph arc", "One Piece anime", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("One Piece official Elbaph broadcast announcement", "https://one-piece.com/news/78689/index.html")],
    updateSummary:
      "Updated the page to reflect the official April 5, 2026 Japanese Elbaph broadcast and removed date speculation.",
    body: statusBody({
      quick:
        "The One Piece anime began its Elbaph arc in Japan on April 5, 2026. The official announcement gives the Japanese return date and time, while international timing remains dependent on licensed distribution in each territory.",
      confirmed: [
        "The Elbaph arc began on April 5, 2026 at 11:15 a.m. JST on Fuji TV and affiliated stations.",
        "The return followed the anime’s scheduled production pause.",
      ],
      reported:
        "The Japanese broadcast date comes from the official One Piece site. A distributor’s listing should be used for country-specific stream timing rather than extrapolating from the Japanese schedule.",
      inferred:
        "Elbaph is a major story phase, but the official return announcement does not confirm the number of episodes or every manga chapter the anime will adapt.",
      unknown: [
        "A complete episode count for the Elbaph adaptation.",
        "Territory-specific stream times not announced by a licensed service.",
        "The exact point at which the television anime will leave the arc.",
      ],
      related: [
        "If you are catching up first, use our maintained ",
        "One Piece filler episode guide",
        "/blog/the-one-piece-filler-episodes-you-shouldn-t-skip",
        ".",
      ],
    }),
  },
  "oshi-no-ko-season-4-release-date-final-season": {
    title: "Oshi no Ko Season 4: Final Season Status & Release Updates",
    excerpt:
      "Oshi no Ko Season 4 has been officially announced as the final season. No premiere date has been announced; here is what the announcement actually confirms.",
    metaTitle: "Oshi no Ko Season 4: Final Season Status",
    metaDescription:
      "Oshi no Ko Season 4 is officially the final season, but it has no announced release date. See what is confirmed and what remains unknown.",
    animeName: "Oshi no Ko",
    articleType: "release-date",
    primaryKeyword: "Oshi no Ko Season 4 release date",
    secondaryKeywords: ["Oshi no Ko final season", "Oshi no Ko Season 4 status"],
    tags: ["Oshi no Ko", "Oshi no Ko Season 4", "Final season", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [
      source("Oshi no Ko official Season 4 announcement", "https://ichigoproduction.com/Season3/news/"),
      source(
        "Crunchyroll Oshi no Ko Season 4 announcement",
        "https://www.crunchyroll.com/news/latest/2026/3/25/oshi-no-ko-anime-season-4-announced-stream-crunchyroll",
      ),
    ],
    updateSummary:
      "Corrected the page after the official final-season announcement: Season 4 is confirmed, but no premiere date is announced.",
    body: statusBody({
      quick:
        "Oshi no Ko Season 4 is officially in production as the anime’s final season. As of September 3, 2026, its official announcement does not provide a broadcast or streaming premiere date.",
      confirmed: [
        "Season 4 has been announced as the final season of the television anime.",
        "Crunchyroll has announced that it will stream the season when it debuts.",
      ],
      reported:
        "The final-season status comes from the official series announcement and Crunchyroll’s distribution announcement. Neither supplies an exact premiere date.",
      inferred:
        "A final-season production decision is not evidence for a particular season of the year, episode count, or release window.",
      unknown: [
        "Japanese premiere date and international release schedule.",
        "Episode count, staff details, and final adaptation range.",
        "Whether any additional format accompanies the television finale.",
      ],
    }),
  },
  "oshi-no-ko-season-3-release-date-and-crunchyroll-schedule-for-2026": {
    title: "Oshi no Ko Season 3 Release Date: January 14, 2026",
    excerpt:
      "Oshi no Ko Season 3 began in Japan on January 14, 2026. This page records the confirmed Japanese broadcast and streaming schedule, separate from current Season 4 news.",
    metaTitle: "Oshi no Ko Season 3: January 14, 2026 Release",
    metaDescription:
      "Oshi no Ko Season 3 began in Japan on January 14, 2026. See the official broadcast and Japanese streaming schedule, plus the current franchise context.",
    animeName: "Oshi no Ko",
    articleType: "release-date",
    primaryKeyword: "Oshi no Ko Season 3 release date",
    secondaryKeywords: ["Oshi no Ko Season 3 January 14 2026", "Oshi no Ko Season 3 streaming schedule"],
    tags: ["Oshi no Ko", "Oshi no Ko Season 3", "Anime release dates", "Anime streaming"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [
      source("Oshi no Ko Season 3 official site", "https://ichigoproduction.com/Season3/"),
      source("Oshi no Ko Season 3 official broadcast information", "https://ichigoproduction.com/Season3/onair/"),
    ],
    updateSummary:
      "Replaced a future-tense forecast with the official January 14, 2026 broadcast record and clarified that it is separate from Season 4 news.",
    body: statusBody({
      quick:
        "Oshi no Ko Season 3 began its Japanese television broadcast on January 14, 2026. This page is now a dated record of that confirmed Season 3 schedule, not a prediction page for a future season.",
      confirmed: [
        "Season 3 began on January 14, 2026, including a weekly Wednesday 11:00 p.m. Tokyo MX broadcast.",
        "The official site lists a 36-station Japanese broadcast network.",
        "ABEMA streamed the season simultaneously in Japan, with additional Japanese services beginning distribution from January 15, 2026.",
      ],
      reported:
        "The date and Japanese distribution details are recorded on the official Oshi no Ko Season 3 site. They should not be used to infer an international schedule without a local distributor announcement.",
      inferred:
        "A completed or previously announced Season 3 schedule does not confirm the timing of Oshi no Ko Season 4.",
      unknown: [
        "Territory-specific availability outside the official Japanese schedule.",
        "Any later Season 3 distribution changes not listed by the rights-holder.",
        "The release date for the separately announced final Season 4.",
      ],
      related: [
        "For the next phase of the anime, see our ",
        "Oshi no Ko Season 4 status guide",
        "/blog/oshi-no-ko-season-4-release-date-final-season",
        ".",
      ],
    }),
  },
  "solo-leveling-beyond-the-system-release-date": {
    title: "Solo Leveling: Beyond the System Release Date & Status",
    excerpt:
      "Solo Leveling: Beyond the System is an officially announced theatrical continuation. Its release date has not been announced; here is the verified status.",
    metaTitle: "Solo Leveling: Beyond the System Release Status",
    metaDescription:
      "Solo Leveling: Beyond the System is an announced theatrical continuation. See the official confirmation, returning studio details, and release-date status.",
    animeName: "Solo Leveling",
    articleType: "release-date",
    primaryKeyword: "Solo Leveling Beyond the System release date",
    secondaryKeywords: ["Solo Leveling movie release date", "Solo Leveling anime continuation"],
    tags: ["Solo Leveling", "Beyond the System", "Solo Leveling movie", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [
      source(
        "Crunchyroll and Aniplex Beyond the System announcement",
        "https://www.crunchyroll.com/news/announcements/2026/7/3/solo-leveling-beyond-the-system-anime-movie-announced-by-aniplex-and-crunchyroll",
      ),
    ],
    updateSummary:
      "Verified the theatrical continuation with the Aniplex and Crunchyroll announcement and removed unsupported release-window claims.",
    body: statusBody({
      quick:
        "Solo Leveling: Beyond the System is officially announced as a theatrical anime continuation after the second television season. No release date or release window has been announced.",
      confirmed: [
        "Beyond the System is a theatrical anime project continuing the story after Season 2.",
        "Aniplex and Crunchyroll are attached to the announcement.",
        "A-1 Pictures is confirmed to return for the project.",
      ],
      reported:
        "The project’s format and returning studio are sourced to the joint official announcement. It does not provide a theatrical date.",
      inferred:
        "The project should be described as an announced film continuation, not as a confirmed third television season.",
      unknown: [
        "Japanese and international theatrical release dates.",
        "Runtime, story range, and release territories.",
        "Whether a later television season will be announced separately.",
      ],
      related: [
        "For the larger conflict it may return to, start with our ",
        "Solo Leveling Monarchs explainer",
        "/blog/solo-leveling-monarchs-explained",
        ".",
      ],
    }),
  },
  "one-piece-film-god-valley-release-date-rocks-roger-garp": {
    title: "One Piece Film God Valley Release Date: Summer 2027",
    excerpt:
      "One Piece Film God Valley is officially scheduled for a Summer 2027 release in Japan. Here is what the announcement confirms and what has not been revealed.",
    metaTitle: "One Piece Film God Valley: Summer 2027 Release",
    metaDescription:
      "One Piece Film God Valley is officially scheduled for Summer 2027 in Japan. See the confirmed release window and what the announcement does not reveal.",
    animeName: "One Piece",
    articleType: "release-date",
    primaryKeyword: "One Piece Film God Valley release date",
    secondaryKeywords: ["One Piece God Valley movie", "One Piece film 2027"],
    tags: ["One Piece", "God Valley", "One Piece Film", "Rocks", "Roger", "Garp"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("One Piece official Film God Valley announcement", "https://one-piece.com/news/81811/index.html")],
    updateSummary:
      "Verified the Summer 2027 Japan release window with the official One Piece announcement and separated it from unannounced film details.",
    body: statusBody({
      quick:
        "One Piece Film God Valley is officially scheduled for a Summer 2027 release in Japan. The announcement also identifies a later One Piece Film BAAD project for 2029.",
      confirmed: [
        "One Piece Film God Valley is scheduled for Summer 2027 in Japan.",
        "The project is part of the manga’s 30th-anniversary planning.",
        "One Piece Film BAAD is separately scheduled for 2029 as part of the anime’s 30th anniversary.",
      ],
      reported:
        "The Summer 2027 window comes from the official One Piece announcement. No specific day or international release plan is supplied there.",
      inferred:
        "The God Valley title signals the setting, but it does not independently confirm the exact plot, character roster, or how the film relates to manga chronology.",
      unknown: [
        "The exact Japanese release date and international theatrical dates.",
        "Director, staff, cast, runtime, and distribution partners.",
        "A detailed synopsis and the film’s precise story approach.",
      ],
      related: [
        "For the current television-anime context, see our ",
        "One Piece Elbaph arc guide",
        "/blog/one-piece-elbaph-arc-release-date-story-setup-and-why-it-matters",
        ".",
      ],
    }),
  },
  "when-is-black-clover-season-2-coming-back-latest-news-and-expectations": {
    title: "Black Clover Season 2: October 2026 Release Status",
    excerpt:
      "Black Clover Season 2 is officially scheduled for October 2026. Here is what the official announcement confirms, without treating an exact date as known.",
    metaTitle: "Black Clover Season 2: October 2026 Status",
    metaDescription:
      "Black Clover Season 2 is officially scheduled for October 2026. See the confirmed return status, official sources, and what remains unknown.",
    animeName: "Black Clover",
    articleType: "release-date",
    primaryKeyword: "Black Clover Season 2 release date",
    secondaryKeywords: ["Black Clover anime return October 2026", "Black Clover new season"],
    tags: ["Black Clover", "Black Clover Season 2", "Asta", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("Black Clover official anime site", "https://www.bclover.jp/")],
    updateSummary:
      "Verified the official October 2026 return window and removed unsupported claims about an exact date and unannounced production details.",
    body: statusBody({
      quick:
        "Black Clover Season 2 is officially scheduled to begin in October 2026. The official anime site does not currently give a premiere day, episode count, or territory-by-territory streaming plan.",
      confirmed: [
        "A second television-anime season is officially scheduled for October 2026.",
        "The official project has released new promotional material for the return.",
      ],
      reported:
        "The October 2026 window comes from the official Black Clover anime site. Claims about a specific October premiere day or unannounced staffing are not treated as confirmed.",
      inferred:
        "A release month is useful planning information, but it is not a broadcast date or an episode-count announcement.",
      unknown: [
        "Exact premiere day and weekly broadcast slot.",
        "International streaming partner and release timing.",
        "Episode count and the exact manga material to be adapted.",
      ],
      related: [
        "For the ability that defines Asta’s role in the story, read ",
        "how Anti-Magic works in Black Clover",
        "/blog/how-does-asta-anti-magic-work-black-clover",
        ".",
      ],
    }),
  },
  "spy-x-family-season-4-release-date": {
    title: "Spy x Family Season 4: Release Date Status",
    excerpt:
      "Spy x Family Season 4 has no official announcement or release date as of September 3, 2026. This page separates verified franchise news from speculation.",
    metaTitle: "Spy x Family Season 4: Release Date Status",
    metaDescription:
      "Spy x Family Season 4 has no official release date announcement as of September 3, 2026. See what is verified and what remains speculation.",
    animeName: "Spy x Family",
    articleType: "release-date",
    primaryKeyword: "Spy x Family Season 4 release date",
    secondaryKeywords: ["Spy x Family Season 4 status", "Spy x Family new season"],
    tags: ["Spy x Family", "Spy x Family Season 4", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("Spy x Family official anime site", "https://spy-family.net/tvseries/")],
    updateSummary:
      "Rechecked the official franchise site and clarified that Season 4 has no official announcement or release date.",
    body: statusBody({
      quick:
        "Spy x Family Season 4 has not been officially announced as of September 3, 2026. That means there is no confirmed release date, production schedule, episode count, or streaming plan to report.",
      confirmed: [
        "The official television-anime site provides franchise information but does not announce a fourth season.",
      ],
      reported:
        "No release-date claim is included here without an announcement from the official site, production committee, studio, broadcaster, or licensed distributor.",
      inferred:
        "Manga availability and the franchise’s popularity do not constitute confirmation of a new television season.",
      unknown: [
        "Whether Season 4 has entered production.",
        "Any release window, staff list, or episode count.",
        "Any streaming-service commitment for a future season.",
      ],
    }),
  },
  "is-demon-slayer-ending-soon-what-the-manga-timeline-suggests": {
    title: "Is Demon Slayer Ending? Infinity Castle Anime Status",
    excerpt:
      "Demon Slayer’s anime finale is being adapted as the Infinity Castle film trilogy. Here is the official status and what is still unannounced for the remaining films.",
    metaTitle: "Demon Slayer Ending: Infinity Castle Status",
    metaDescription:
      "Demon Slayer’s finale is the Infinity Castle film trilogy. See the official adaptation status and what remains unannounced for later films.",
    animeName: "Demon Slayer: Kimetsu no Yaiba",
    articleType: "news",
    primaryKeyword: "Is Demon Slayer anime ending",
    secondaryKeywords: ["Demon Slayer Infinity Castle trilogy", "Demon Slayer final arc anime"],
    tags: ["Demon Slayer", "Infinity Castle", "Demon Slayer ending", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("Demon Slayer official Infinity Castle announcement", "https://kimetsu.com/anime/news/?id=65691")],
    updateSummary:
      "Reframed the article around the officially confirmed Infinity Castle film trilogy and removed timeline predictions for unannounced later releases.",
    body: statusBody({
      quick:
        "Demon Slayer’s television-era finale is being adapted as the Infinity Castle film trilogy. The trilogy is officially confirmed, but later-film dates should not be treated as known until the official project announces them.",
      confirmed: [
        "The Infinity Castle arc is being adapted as a theatrical trilogy.",
        "The trilogy is the anime’s announced route through the final phase of the story.",
      ],
      reported:
        "The trilogy format is sourced to the official Demon Slayer project. A schedule for every remaining installment requires a separate official announcement.",
      inferred:
        "Because the manga is complete, the broad narrative endpoint is known. That does not establish a release timetable for the film adaptation.",
      unknown: [
        "The exact release dates for later Infinity Castle films.",
        "The theatrical rollout outside Japan for each installment.",
        "How the final chapters will be divided between films.",
      ],
      related: [
        "For a key power-system question before the finale, see our guide to the ",
        "Demon Slayer Mark",
        "/blog/demon-slayer-mark-explained-powers-curse",
        ".",
      ],
    }),
  },
  "dandadan-season-3-release-date-2027": {
    title: "Dandadan Season 3 Release Date: 2027 Status",
    excerpt:
      "Dandadan Season 3 is officially confirmed for 2027 with Science SARU returning. No exact release date has been announced.",
    metaTitle: "Dandadan Season 3 Release Date: 2027 Status",
    metaDescription:
      "Dandadan Season 3 is officially set for 2027. See the confirmed studio return, release-date status, and what has not been announced.",
    animeName: "Dandadan",
    articleType: "release-date",
    primaryKeyword: "Dandadan Season 3 release date",
    secondaryKeywords: ["Dandadan Season 3 2027", "Dandadan anime Season 3"],
    tags: ["Dandadan", "Dandadan Season 3", "Evil Eye", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("Dandadan official Season 3 announcement", "https://anime-dandadan.com/news/2673/")],
    updateSummary:
      "Verified the official 2027 Season 3 announcement and removed unsupported exact-date expectations.",
    body: statusBody({
      quick:
        "Dandadan Season 3 is officially scheduled for 2027, with Science SARU returning. The official announcement does not provide an exact premiere date, episode count, or international release schedule.",
      confirmed: [
        "Dandadan Season 3 is officially confirmed for 2027.",
        "Science SARU is confirmed to return for the season.",
      ],
      reported:
        "The 2027 window and studio return are sourced to the official Dandadan announcement. No date within that year is currently confirmed.",
      inferred:
        "A year-level announcement does not establish a particular season, day, or simulcast schedule.",
      unknown: [
        "Exact Japanese premiere date and international streaming dates.",
        "Episode count and confirmed story range.",
        "Complete staff and cast announcements.",
      ],
      related: [
        "For a major question from the current story, see our ",
        "Dandadan Evil Eye explainer",
        "/blog/dandadan-evil-eye-jiji-possession-explained",
        ".",
      ],
    }),
  },
  "jujutsu-kaisen-season-4-release-date-culling-game-part-2": {
    title: "Jujutsu Kaisen Season 4: Culling Game Status & Release Updates",
    excerpt:
      "Jujutsu Kaisen Season 4’s Culling Game continuation has official teaser material, but no release date has been announced. Here is the verified status.",
    metaTitle: "Jujutsu Kaisen Season 4: Status & Release Updates",
    metaDescription:
      "Jujutsu Kaisen Season 4 has official Culling Game teaser material, but no release date. See confirmed details and what remains unannounced.",
    animeName: "Jujutsu Kaisen",
    articleType: "release-date",
    primaryKeyword: "Jujutsu Kaisen Season 4 release date",
    secondaryKeywords: ["Jujutsu Kaisen Culling Game Part 2", "Jujutsu Kaisen Season 4 status"],
    tags: ["Jujutsu Kaisen", "Jujutsu Kaisen Season 4", "Culling Game", "Anime release dates"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [source("Jujutsu Kaisen official Season 4 update", "https://jujutsukaisen.jp/news/20260619_01.php")],
    updateSummary:
      "Verified the official Culling Game continuation material and removed any implication that a Season 4 premiere date is confirmed.",
    body: statusBody({
      quick:
        "Jujutsu Kaisen Season 4 has official Culling Game continuation teaser material. As of September 3, 2026, the official update does not announce a broadcast date or international streaming schedule.",
      confirmed: [
        "The official project has released material for the latter part of the Culling Game.",
        "The next television-anime phase remains tied to the Culling Game storyline.",
      ],
      reported:
        "The teaser update comes from the official Jujutsu Kaisen site. It is not a release-date announcement.",
      inferred:
        "Story placement can indicate the next narrative focus, but it cannot establish a premiere window, episode count, or a final season label.",
      unknown: [
        "Japanese broadcast date and international simulcast plan.",
        "Episode count, staff credits, and the exact adaptation range.",
        "Whether further announcements will use a different Season 4 naming convention.",
      ],
      related: [
        "For the rule system behind its strongest characters, read ",
        "our Heavenly Restriction explainer",
        "/blog/jujutsu-kaisen-heavenly-restriction-explained",
        ".",
      ],
    }),
  },
  "re-zero-season-4-explained-subaru-next-arc": {
    title: "Re:Zero Season 4: Release Status & Subaru’s Next Arc",
    excerpt:
      "Re:Zero Season 4 began in Japan on April 8, 2026. This guide separates the verified broadcast status from story assumptions about Subaru’s next arc.",
    metaTitle: "Re:Zero Season 4: Release Status & Next Arc",
    metaDescription:
      "Re:Zero Season 4 began April 8, 2026 in Japan. See the verified broadcast status and what remains unknown about its adaptation plan.",
    animeName: "Re:Zero − Starting Life in Another World",
    articleType: "news",
    primaryKeyword: "Re:Zero Season 4 release date",
    secondaryKeywords: ["Re:Zero Season 4 April 8 2026", "Re:Zero Subaru next arc"],
    tags: ["Re:Zero", "Re:Zero Season 4", "Subaru", "Return by Death"],
    categories: [categoryRef(categoryIds.news), categoryRef(categoryIds.tv)],
    sources: [
      source("Re:Zero official Season 4 special site", "https://re-zero-anime.jp/tv/special/index.html"),
      source(
        "Crunchyroll Re:Zero Season 4 streaming announcement",
        "https://www.crunchyroll.com/news/announcements/2025/7/6/rezero-starting-life-in-another-world-season-4-to-stream-on-crunchyroll-in-2026",
      ),
    ],
    updateSummary:
      "Updated the page from a release-date forecast to the verified April 8, 2026 Season 4 broadcast status and added official sources.",
    body: statusBody({
      quick:
        "Re:Zero − Starting Life in Another World Season 4 began in Japan on April 8, 2026. Crunchyroll previously confirmed it would stream the season in 2026, while individual territory schedules should be checked with the service.",
      confirmed: [
        "Season 4 began in Japan on April 8, 2026.",
        "Crunchyroll announced that it would stream the season in 2026.",
      ],
      reported:
        "The Japanese date is listed on the official Re:Zero project site. Crunchyroll’s announcement supports the streaming commitment, not every local release time.",
      inferred:
        "The season’s source-material position can guide spoiler discussion, but it does not confirm its eventual episode count or final adaptation endpoint.",
      unknown: [
        "The final episode count and completed adaptation range.",
        "Any additional cours or continuation beyond the announced season.",
        "Territory-specific release details not stated by the distributor.",
      ],
      related: [
        "For the rule that shapes every Subaru decision, read ",
        "how Return by Death works",
        "/blog/how-does-subaru-return-by-death-work-re-zero",
        ".",
      ],
    }),
  },
};

const evergreenFields = {
  "why-frieren-hides-her-mana": {
    excerpt: "Why Frieren hides her mana, how mana suppression works, and why the choice is central to her strategy and the series’ view of power.",
    metaTitle: "Why Frieren Hides Her Mana: Strategy Explained",
    metaDescription: "Why does Frieren hide her mana? This guide explains mana suppression, the tactical logic behind it, and why raw power misleads opponents.",
    animeName: "Frieren: Beyond Journey's End",
    articleType: "explained",
    primaryKeyword: "why Frieren hides her mana",
    secondaryKeywords: ["Frieren mana suppression", "Frieren mana explained"],
    tags: ["Frieren", "Frieren mana", "Mana suppression", "Anime lore"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified search intent, metadata, and franchise taxonomy; retained the existing analysis.",
  },
  "who-is-jinshi-apothecary-diaries-true-identity": {
    excerpt: "Jinshi’s true identity in The Apothecary Diaries explained: what the anime establishes, why his public role is misleading, and what Maomao notices.",
    metaTitle: "Jinshi’s True Identity in The Apothecary Diaries",
    metaDescription: "Who is Jinshi in The Apothecary Diaries? A spoiler-aware explanation of his true identity, court position, and why he hides in plain sight.",
    animeName: "The Apothecary Diaries",
    articleType: "characters",
    primaryKeyword: "Jinshi true identity Apothecary Diaries",
    secondaryKeywords: ["who is Jinshi Apothecary Diaries", "Jinshi identity explained"],
    tags: ["The Apothecary Diaries", "Jinshi", "Maomao", "Anime characters"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified search intent, metadata, and franchise taxonomy; retained the existing spoiler-aware explanation.",
  },
  "solo-leveling-monarchs-explained": {
    excerpt: "The Solo Leveling Monarchs explained: their role in the war, their powers, and why they matter to Sung Jinwoo’s place in the story.",
    metaTitle: "Solo Leveling Monarchs Explained: Powers & Roles",
    metaDescription: "The Solo Leveling Monarchs explained: their roles, powers, connection to Sung Jinwoo, and why the Monarch-Ruler conflict matters.",
    animeName: "Solo Leveling",
    articleType: "explained",
    primaryKeyword: "Solo Leveling Monarchs explained",
    secondaryKeywords: ["Solo Leveling Monarchs powers", "Monarchs and Rulers Solo Leveling"],
    tags: ["Solo Leveling", "Monarchs", "Sung Jinwoo", "Anime lore"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified the Monarchs search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
  "how-does-asta-anti-magic-work-black-clover": {
    excerpt: "How Asta’s Anti-Magic works in Black Clover: its limits, why it is not ordinary magic, and how it changes his matchups and role.",
    metaTitle: "How Asta’s Anti-Magic Works in Black Clover",
    metaDescription: "How does Asta’s Anti-Magic work? A clear Black Clover guide to its rules, limits, swords, Devil Union, and why it is not normal magic.",
    animeName: "Black Clover",
    articleType: "explained",
    primaryKeyword: "how does Asta Anti-Magic work",
    secondaryKeywords: ["Asta Anti-Magic explained", "Black Clover Anti-Magic powers"],
    tags: ["Black Clover", "Asta", "Anti-Magic", "Devil Union", "Anime power systems"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified Anti-Magic search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
  "how-does-subaru-return-by-death-work-re-zero": {
    excerpt: "How Subaru’s Return by Death works in Re:Zero: what resets, what does not, why he cannot explain it freely, and the rule’s emotional cost.",
    metaTitle: "How Subaru’s Return by Death Works in Re:Zero",
    metaDescription: "How does Return by Death work in Re:Zero? A clear guide to Subaru’s resets, limits, the Witch’s taboo, and the cost of each loop.",
    animeName: "Re:Zero − Starting Life in Another World",
    articleType: "explained",
    primaryKeyword: "how does Subaru Return by Death work",
    secondaryKeywords: ["Return by Death explained", "Re:Zero time loop rules"],
    tags: ["Re:Zero", "Subaru", "Return by Death", "Anime power systems"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified Return by Death search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
  "demon-slayer-mark-explained-powers-curse": {
    excerpt: "The Demon Slayer Mark explained: what activates it, what it changes in combat, and why its curse matters to the series’ strongest fighters.",
    metaTitle: "Demon Slayer Mark Explained: Powers & Curse",
    metaDescription: "What is the Demon Slayer Mark? This guide explains its activation, powers, conditions, curse, and why it matters in Infinity Castle.",
    animeName: "Demon Slayer: Kimetsu no Yaiba",
    articleType: "explained",
    primaryKeyword: "Demon Slayer Mark explained",
    secondaryKeywords: ["Demon Slayer Mark powers", "Demon Slayer Mark curse"],
    tags: ["Demon Slayer", "Demon Slayer Mark", "Hashira", "Anime power systems"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified Demon Slayer Mark search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
  "jujutsu-kaisen-heavenly-restriction-explained": {
    excerpt: "Heavenly Restriction in Jujutsu Kaisen explained: the trade-off behind Maki and Toji’s power, what it costs, and why it differs from a normal technique.",
    metaTitle: "Heavenly Restriction Explained in Jujutsu Kaisen",
    metaDescription: "What is Heavenly Restriction in Jujutsu Kaisen? A guide to Maki, Toji, the power trade-off, and why it differs from cursed techniques.",
    animeName: "Jujutsu Kaisen",
    articleType: "explained",
    primaryKeyword: "Heavenly Restriction explained Jujutsu Kaisen",
    secondaryKeywords: ["Maki Heavenly Restriction", "Toji Heavenly Restriction"],
    tags: ["Jujutsu Kaisen", "Heavenly Restriction", "Maki Zenin", "Toji Fushiguro", "Anime power systems"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified Heavenly Restriction search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
  "dandadan-evil-eye-jiji-possession-explained": {
    excerpt: "The Evil Eye in Dandadan explained: what the curse is, why it targets Jiji, and how it changes the story’s balance between occult horror and comedy.",
    metaTitle: "Dandadan Evil Eye Explained: Curse, Jiji & Powers",
    metaDescription: "What is the Evil Eye in Dandadan? A spoiler-aware guide to the curse, Jiji’s connection, its powers, and why the arc matters.",
    animeName: "Dandadan",
    articleType: "explained",
    primaryKeyword: "Dandadan Evil Eye explained",
    secondaryKeywords: ["Dandadan Evil Eye curse", "Jiji Evil Eye explained"],
    tags: ["Dandadan", "Evil Eye", "Jiji", "Anime lore"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified Evil Eye search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
  "every-chainsaw-man-devil-contract-explained": {
    excerpt: "Chainsaw Man devil contracts explained: what a contract costs, how its rules work, and why contracts reveal a character’s choices as much as their power.",
    metaTitle: "Chainsaw Man Devil Contracts Explained",
    metaDescription: "How do devil contracts work in Chainsaw Man? A guide to their rules, costs, major examples, and why every contract has a consequence.",
    animeName: "Chainsaw Man",
    articleType: "explained",
    primaryKeyword: "Chainsaw Man devil contracts explained",
    secondaryKeywords: ["how devil contracts work Chainsaw Man", "Chainsaw Man contracts"],
    tags: ["Chainsaw Man", "Devil contracts", "Makima", "Anime power systems"],
    categories: [categoryRef(categoryIds.opinion)],
    updateSummary: "Clarified devil-contract search intent, metadata, and franchise taxonomy; retained the existing explainer.",
  },
};

const fillerPost = {
  slug: "the-one-piece-filler-episodes-you-shouldn-t-skip",
  title: "One Piece Filler List: Episodes You Can Skip (and the Few Worth Watching)",
  excerpt:
    "A maintained One Piece filler guide that separates full filler arcs, mixed canon episodes, recap installments, and the few anime-original stories worth your time.",
  metaTitle: "One Piece Filler List: Episodes You Can Skip",
  metaDescription:
    "A practical One Piece filler list: full filler arcs, mixed-canon episodes, recaps, and the few anime-original stories worth watching before you skip.",
  animeName: "One Piece",
  articleType: "explained",
  primaryKeyword: "One Piece filler list",
  secondaryKeywords: ["One Piece filler episodes to skip", "One Piece filler guide", "One Piece canon episodes"],
  tags: ["One Piece", "One Piece filler", "Anime guides", "One Piece episodes"],
  categories: [categoryRef(categoryIds.lists)],
  sources: [
    source("Anime Filler List: One Piece", "https://www.animefillerlist.tv/guide/one-piece/"),
    source("GamesRadar: One Piece filler list", "https://www.gamesradar.com/entertainment/anime-shows/one-piece-filler-list/"),
  ],
  updateSummary:
    "Replaced conflicting legacy episode ranges with a source-backed filler classification and clearer skip-versus-watch guidance.",
  body: [
    paragraph(
      "One Piece has comparatively little filler for a long-running anime, but the useful question is not simply which episodes are non-canon. It is whether an anime-original detour is worth your time. This guide separates full filler arcs, recap episodes, mixed-canon installments, and the few optional stories that are genuinely fun if you want more time with the Straw Hats.",
    ),
    heading("Quick answer: what One Piece filler can you skip?"),
    paragraph(
      "If you want the fastest route through the main story, skip the full filler and recap groups below. Keep mixed-canon episodes unless you have checked a current episode guide: anime-original scenes are often woven into a canon episode, and skipping the whole installment can leave a narrative gap. The ranges below reflect classifications published by filler-guide references, which can differ at the edges where an adaptation blends material.",
    ),
    heading("How this guide classifies episodes"),
    bullet("Filler: an anime-original story that does not advance the manga’s main narrative."),
    bullet("Mixed canon: a manga-based episode with added scenes or reordered material. These are generally worth watching."),
    bullet("Recap: an episode primarily designed to summarize earlier events; optional unless you need a refresher."),
    bullet("Optional but enjoyable: an anime-original story with useful crew chemistry, a strong setting, or film context."),
    heading("One Piece filler episodes you can safely skip"),
    paragraph(
      "These are the main anime-original or recap blocks usually safe to skip when you are focused on the central manga storyline. Check a current episode listing before skipping an isolated special, particularly when a crossover or film tie-in sits close to canon material.",
    ),
    bullet("Episodes 54–61 — Warship Island arc."),
    bullet("Episodes 131–135 — Post-Alabasta character side stories."),
    bullet("Episodes 136–138 — Goat Island arc; episodes 139–143 — Ruluka Island arc."),
    bullet("Episodes 196–206 — G-8 arc."),
    bullet("Episodes 220–224 — Ocean’s Dream arc; episodes 225–226 — Foxy’s Return."),
    bullet("Episodes 279–283 — Straw Hat recap episodes."),
    bullet("Episodes 291–292 and 303 — historical Boss Luffy specials."),
    bullet("Episodes 317–319 — Post-Enies Lobby side stories; episodes 326–335 — Ice Hunter arc."),
    bullet("Episodes 382–384 and 406–407 — short anime-original blocks."),
    bullet("Episodes 426–429 — Little East Blue film tie-in; episodes 457–458 — recap episodes."),
    bullet("Episodes 492 and 542 — crossover or promotional specials."),
    bullet("Episodes 575–578 — Z’s Ambition; episodes 626–628 — Caesar Retrieval."),
    bullet("Episodes 747–750 — Silver Mine; episodes 780–782 — Marine Rookie."),
    bullet("Episodes 895–896 — Cidre Guild; episode 907 — Romance Dawn special; episodes 1029–1030 — Uta’s Past."),
    heading("The filler arcs worth watching if you have time"),
    paragraph(
      "G-8 (196–206) is the clearest recommendation: it plays like a self-contained crew-escape story and has a reputation for feeling unusually close to the series’ comedy and rhythm. Little East Blue (426–429), Z’s Ambition (575–578), and Uta’s Past (1029–1030) are optional film-context material. Watch them only if you plan to see their connected films; they are not required for the television plot.",
    ),
    heading("Do not confuse pacing with filler"),
    paragraph(
      "One Piece can move slowly, especially inside very long arcs. Slow pacing is not filler. Skipping canon episodes to solve pacing can remove setup, character motivation, and emotional payoff. If you want a faster catch-up, use a trusted edited-viewing option where available, but keep this list for actual anime-original or recap material rather than treating every stretched episode as disposable.",
    ),
    heading("How to use this guide without getting lost"),
    paragraph(
      "Check this list before starting a new episode block, not after you are already unsure what happened. Continue through canon and mixed-canon installments, skip recaps when the story is fresh, and make an intentional choice on full filler arcs. That gives you the speed of a skip list without losing the crew-focused material that makes One Piece enjoyable between major arcs.",
    ),
    linkedParagraph(
      "When you are caught up, see our ",
      "One Piece Elbaph arc guide",
      "/blog/one-piece-elbaph-arc-release-date-story-setup-and-why-it-matters",
      " for the current anime schedule context.",
    ),
  ],
};

const contextualLinks = [
  {
    slug: "macht-golden-land-explained-frieren-season-3-villain",
    heading: "Why Frieren Is Such a Dangerous Opponent for Macht",
    href: "/blog/why-frieren-hides-her-mana",
    parts: ["Macht’s reading of opponents makes ", "Frieren’s mana suppression", " especially important to the way this conflict is built."],
  },
  {
    slug: "why-frieren-feels-different-from-other-fantasy-anime",
    heading: "A Fantasy About Time, Not Power",
    href: "/blog/why-frieren-hides-her-mana",
    parts: ["That quiet relationship to power is clearest in ", "why Frieren hides her mana", ", a choice the series treats as strategy rather than spectacle."],
  },
  {
    slug: "why-maomao-pretends-to-be-ordinary-apothecary-diaries",
    heading: "Jinshi Sees Through the Version of Maomao She Presents",
    href: "/blog/who-is-jinshi-apothecary-diaries-true-identity",
    parts: ["His interest is inseparable from the larger court secret behind ", "Jinshi’s true identity", "."],
  },
  {
    slug: "is-the-apothecary-diaries-worth-watching-why-maomao-is-anime-s-smartest-heroine",
    heading: "Why Romance Takes a Backseat",
    href: "/blog/who-is-jinshi-apothecary-diaries-true-identity",
    parts: ["The tension works because the audience is also invited to question ", "who Jinshi really is", ", not simply whether Maomao will return his interest."],
  },
  {
    slug: "every-s-rank-hunter-solo-leveling-ranked",
    heading: "The Ranking Criteria",
    href: "/blog/solo-leveling-monarchs-explained",
    parts: ["The national-rank scale only tells part of the story once the ", "Monarchs enter Solo Leveling’s conflict", "."],
  },
  {
    slug: "can-sung-jin-woo-beat-goku-solo-leveling-vs-dragon-ball-z",
    heading: "Abilities and Hax",
    href: "/blog/solo-leveling-monarchs-explained",
    parts: ["For the story-specific hierarchy behind those abilities, start with the ", "Solo Leveling Monarchs", "."],
  },
  {
    slug: "why-solo-leveling-feels-overhyped-after-the-first-arc",
    heading: "The Problem With Power Escalation",
    href: "/blog/solo-leveling-monarchs-explained",
    parts: ["That escalation becomes easier to read once the ", "Monarchs’ role in Solo Leveling", " is clear."],
  },
  {
    slug: "jujutsu-kaisen-vs-demon-slayer-animation-story-and-power-system-compared",
    heading: "Power System: Breathing Techniques vs Cursed Energy",
    href: "/blog/jujutsu-kaisen-heavenly-restriction-explained",
    parts: ["One major exception to technique-based power is ", "Heavenly Restriction in Jujutsu Kaisen", ", which changes the body itself rather than supplying ordinary cursed energy."],
  },
  {
    slug: "demon-slayer-infinity-castle-why-the-final-arc-could-break-every-anime-record",
    heading: "The Emotional Stakes Have Never Been Higher",
    href: "/blog/demon-slayer-mark-explained-powers-curse",
    parts: ["The stakes also sharpen because the ", "Demon Slayer Mark", " turns power into a question of cost, not just strength."],
  },
  {
    slug: "best-anime-like-re-zero-with-time-loop-concepts-that-actually-hit-hard",
    heading: "", 
    href: "/blog/how-does-subaru-return-by-death-work-re-zero",
    parts: ["The comparison begins with ", "how Subaru’s Return by Death works", ", because Re:Zero treats the loop as trauma and responsibility rather than a reset button."],
  },
  {
    slug: "summer-time-rendering-ending-explained",
    heading: "How Did Shinpei Create the Final Timeline?",
    href: "/blog/how-does-subaru-return-by-death-work-re-zero",
    parts: ["That contrast is useful beside ", "Subaru’s Return by Death in Re:Zero", ", whose rules are deliberately less controllable for the person trapped inside them."],
  },
  {
    slug: "summer-time-rendering-is-the-best-thriller-anime-most-fans-missed",
    heading: "",
    href: "/blog/how-does-subaru-return-by-death-work-re-zero",
    parts: ["For a harsher version of the same emotional premise, see ", "how Return by Death works in Re:Zero", "."],
  },
  {
    slug: "every-chainsaw-man-devil-contract-explained",
    heading: "Makima’s Contract With Japan’s Prime Minister",
    href: "/blog/chainsaw-man-four-horsemen-explained",
    parts: ["That political scale matters once the ", "Four Horsemen in Chainsaw Man", " enter the story’s wider framework."],
  },
  {
    slug: "chainsaw-man-review-why-this-anime-feels-empty-brutal-and-wrong-on-purpose",
    heading: "Makima: The Architecture of Control",
    href: "/blog/chainsaw-man-four-horsemen-explained",
    parts: ["Her control is part of a larger mythology explored in our guide to the ", "Four Horsemen of Chainsaw Man", "."],
  },
  {
    slug: "black-clover-magic-knight-captains-ranked-strongest",
    heading: "How the 2026 Black Clover Anime Return Changes This Ranking",
    href: "/blog/how-does-asta-anti-magic-work-black-clover",
    parts: ["Asta’s place in any power ranking depends on the unusual rules of ", "his Anti-Magic", ", not a normal mana comparison."],
  },
];

function publicFields(spec) {
  return {
    title: spec.title,
    excerpt: spec.excerpt,
    metaTitle: spec.metaTitle,
    metaDescription: spec.metaDescription,
    animeName: spec.animeName,
    articleType: spec.articleType,
    primaryKeyword: spec.primaryKeyword,
    secondaryKeywords: spec.secondaryKeywords,
    tags: spec.tags,
    categories: spec.categories,
    updatedAt,
    updateHistory: [update(spec.updateSummary)],
  };
}

async function main() {
  const expectedDestinationSlugs = [
    "what-does-ego-mean-in-blue-lock",
    "chainsaw-man-four-horsemen-explained",
  ];
  const targetSlugs = [
    ...Object.keys(statusPosts),
    ...Object.keys(evergreenFields),
    fillerPost.slug,
    ...contextualLinks.map((item) => item.slug),
    ...expectedDestinationSlugs,
  ];
  const posts = await client.fetch(
    `*[_type == "post" && slug.current in $slugs]{_id, "slug": slug.current, body, updateHistory}`,
    { slugs: [...new Set(targetSlugs)] },
  );
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const missing = [...new Set(targetSlugs)].filter((slug) => !bySlug.has(slug));
  if (missing.length) throw new Error(`Missing expected existing posts: ${missing.join(", ")}`);

  const mutations = [];
  for (const [slug, spec] of Object.entries(statusPosts)) {
    const post = bySlug.get(slug);
    mutations.push({
      id: post._id,
      slug,
      fields: { ...publicFields(spec), sources: spec.sources, body: spec.body },
      label: "status refresh",
    });
  }

  for (const [slug, spec] of Object.entries(evergreenFields)) {
    const post = bySlug.get(slug);
    mutations.push({ id: post._id, slug, fields: publicFields(spec), label: "evergreen governance refresh" });
  }

  const filler = bySlug.get(fillerPost.slug);
  mutations.push({
    id: filler._id,
    slug: fillerPost.slug,
    fields: {
      ...publicFields(fillerPost),
      body: fillerPost.body,
      sources: fillerPost.sources,
    },
    label: "filler-guide refresh",
  });

  for (const item of contextualLinks) {
    const post = bySlug.get(item.slug);
    const currentBody = Array.isArray(post.body) ? post.body : [];
    if (hasHref(currentBody, item.href)) continue;
    const linkBlock = linkedParagraph(item.parts[0], item.parts[1], item.href, item.parts[2]);
    const body = item.heading ? insertAfterHeading(currentBody, item.heading, linkBlock) : [...currentBody, linkBlock];
    mutations.push({
      id: post._id,
      slug: item.slug,
      fields: { body, updatedAt },
      label: `contextual link to ${item.href}`,
    });
  }

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", documents: mutations.length, mutations: mutations.map(({ slug, label }) => ({ slug, label })) }, null, 2));
  if (!apply) return;

  let transaction = client.transaction();
  for (const mutation of mutations) transaction = transaction.patch(mutation.id, { set: mutation.fields });
  const result = await transaction.commit({ autoGenerateArrayKeys: true });
  console.log(JSON.stringify({ committed: true, transactionId: result.transactionId, documents: mutations.length }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
