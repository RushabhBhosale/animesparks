import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { TrendingRail } from "@/components/trending-rail";
import {
  homepageAnimeClustersQuery,
  homepageSettingsQuery,
  latestBlogsQuery,
} from "@/sanity/blogQueries";
import { client } from "@/lib/content/client";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { formatPostDate } from "@/utils/date";
import { defaultOgImage, siteName } from "@/utils/seo";
import { splineSans } from "@/lib/font";
import { fetchGaPageViews } from "@/lib/analytics";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { EditorialCard } from "@/components/editorial-card";
import { getTrendingPosts } from "@/lib/trending";

export const revalidate = 60;

const metaTitle = "AnimeSparks — Deep Anime Analysis, Reviews & Recommendations";
const metaDescription =
  "Thoughtful anime analysis, sharp reviews, and honest opinions on popular and underrated series. Explore anime beyond surface-level hype.";

export const metadata: Metadata = {
  title: { absolute: metaTitle },
  description: metaDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
    images: [defaultOgImage],
  },
};

type BlogCard = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: {
    name?: string;
    image?: { asset?: { url?: string }; alt?: string };
  };
  viewCount?: number;
};

type HomepageSettings = {
  editorsPicks?: BlogCard[];
};

type AnimeClusterPost = {
  _id: string;
  animeName: string;
  slug: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

type AnimeCluster = {
  name: string;
  count: number;
  cover?: AnimeClusterPost["mainImage"];
};

const getExcerpt = (text?: string, limit = 150) => {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
};

const takeUniqueById = (posts: BlogCard[], usedIds: Set<string>) => {
  const output: BlogCard[] = [];

  for (const post of posts) {
    if (!post?._id || usedIds.has(post._id)) continue;
    usedIds.add(post._id);
    output.push(post);
  }

  return output;
};

export default async function Home() {
  const [latest, homepageSettings, trendingPack, animeClusterPosts] = await Promise.all([
    client.fetch<BlogCard[]>(latestBlogsQuery),
    client.fetch<HomepageSettings | null>(homepageSettingsQuery),
    getTrendingPosts({
      limit: 10,
      collageWindowDays: 30, // Trending Now window: 30 days
      mustReadsWindowDays: 7, // Popular This Week window: 7 days
    }),
    client.fetch<AnimeClusterPost[]>(homepageAnimeClustersQuery),
  ]);

  const latestPosts = Array.isArray(latest) ? latest : [];
  const trendingViews: BlogCard[] = [];
  const editorsConfigured = homepageSettings?.editorsPicks ?? [];

  const slugSet = new Set<string>();
  [
    ...latestPosts,
    ...trendingViews,
    ...editorsConfigured,
  ].forEach((post) => {
    if (post?.slug) slugSet.add(post.slug);
  });

  const gaViews = await fetchGaPageViews(Array.from(slugSet));
  const hasGaViews = Object.keys(gaViews).length > 0;
  const withViews = (post: BlogCard) => ({
    ...post,
    viewCount: hasGaViews ? (gaViews[post.slug] ?? 0) : undefined,
  });

  const latestWithViews = latestPosts.map(withViews);
  const trendingWithViews = trendingViews.map(withViews);
  const editorsWithViews = editorsConfigured.map(withViews);

  const featured =
    editorsWithViews[0] ?? trendingWithViews[0] ?? latestWithViews[0] ?? null;

  const baseUsed = new Set<string>();
  if (featured?._id) baseUsed.add(featured._id);

  const editorsSource =
    editorsWithViews.length > 0 ? editorsWithViews : latestWithViews;
  const editorsPicks = takeUniqueById(editorsSource, new Set(baseUsed)).slice(
    0,
    3,
  );

  const usedForLatest = new Set(baseUsed);
  editorsPicks.forEach((p) => {
    if (p?._id) usedForLatest.add(p._id);
  });

  const mainStream = takeUniqueById(latestWithViews, new Set(usedForLatest));
  let mainUpdates = mainStream.slice(0, 3);
  let moreUpdates = mainStream.slice(3, 6);

  if (mainUpdates.length === 0) {
    // fallback: show latest even if duplicates
    mainUpdates = latestWithViews.slice(0, 3);
    moreUpdates = latestWithViews.slice(3, 6);
  }

  const trendingCollage = trendingPack.collage;
  const mustReads = trendingPack.mustReads;
  const animeClusterMap = new Map<string, AnimeCluster>();
  for (const post of animeClusterPosts || []) {
    const name = post.animeName?.trim();
    if (!name) continue;
    const existing = animeClusterMap.get(name);
    if (existing) {
      existing.count += 1;
      if (!existing.cover && post.mainImage?.asset?.url) existing.cover = post.mainImage;
    } else {
      animeClusterMap.set(name, {
        name,
        count: 1,
        cover: post.mainImage?.asset?.url ? post.mainImage : undefined,
      });
    }
  }
  const animeClusters = Array.from(animeClusterMap.values())
    .filter((cluster) => cluster.count >= 2)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6);

  const sections = Array.from(new Map(latestPosts.flatMap((post) => post.categories || []).map((category) => [category.slug, category])).values()).slice(0, 6);

  return (
    <>
      <Header />
      <main className={`${splineSans.className} editorial-home`}>
        <div className="editorial-shell">
          <div className="edition-line">
            <span><span className="edition-dot" /> Independent anime editorial</span>
            <span className="hidden sm:inline">Analysis / Characters / Culture</span>
          </div>
          {sections.length > 0 && (
            <nav className="section-navigation" aria-label="Editorial sections">
              <span className="editorial-kicker">Explore</span>
              {sections.map((section) => <Link key={section.slug} href={`/categories/${section.slug}`}>{section.title}</Link>)}
              <Link href="/categories" className="section-navigation-all">All sections <ArrowUpRight size={14} /></Link>
            </nav>
          )}

          {featured && (
            <section className="cover-story" aria-labelledby="cover-title">
              <div className="cover-copy">
                <div className="editorial-kicker"><span className="text-anime-lime">The cover story</span><span className="text-white/30"> / 01</span></div>
                {featured.categories?.[0] && <Link className="cover-category" href={`/categories/${featured.categories[0].slug}`}>{featured.categories[0].title}</Link>}
                <h1 id="cover-title"><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h1>
                {featured.excerpt && <p className="cover-excerpt">{getExcerpt(featured.excerpt, 210)}</p>}
                <div className="editorial-meta">
                  {featured.author?.name && <span>{featured.author.name}</span>}
                  {featured.publishedAt && <time dateTime={featured.publishedAt}>{formatPostDate(featured.publishedAt)}</time>}
                </div>
                <Link href={`/blog/${featured.slug}`} className="editorial-button">Read the story <ArrowUpRight size={18} /></Link>
              </div>
              {featured.mainImage?.asset?.url && (
                <Link href={`/blog/${featured.slug}`} className="cover-image" aria-label={`Read ${featured.title}`}>
                  <Image src={sanityHeroImageUrl(featured.mainImage)} alt={featured.mainImage.alt || featured.title} fill priority fetchPriority="high" sizes="(max-width: 900px) 94vw, 720px" className="object-cover" />
                  <span className="cover-image-label">AnimeSparks <span>Featured Story</span></span>
                </Link>
              )}
            </section>
          )}

          {editorsPicks.length > 0 && (
            <section className="editorial-section" aria-labelledby="editors-heading">
              <div className="editorial-section-heading"><div><p className="editorial-kicker">Selected reading</p><h2 id="editors-heading">Editor’s picks<span className="text-anime-red">.</span></h2></div><Link href="/blogs">Explore the archive <ArrowUpRight size={16} /></Link></div>
              <div className="editorial-grid">{editorsPicks.map((post) => <EditorialCard key={post._id} post={post} />)}</div>
            </section>
          )}

          <div className="editorial-columns editorial-section">
            <section aria-labelledby="latest-heading" className="min-w-0">
              <div className="editorial-section-heading"><div><p className="editorial-kicker">From the editorial desk</p><h2 id="latest-heading">Latest stories<span className="text-anime-red">.</span></h2></div><Link href="/blogs">View all <ArrowUpRight size={16} /></Link></div>
              <div className="editorial-list">{[...mainUpdates, ...moreUpdates].map((post) => <EditorialCard key={post._id} post={post} layout="row" />)}</div>
              <Link href="/blogs" className="editorial-archive-link">Browse all blogs <ArrowUpRight size={18} /></Link>
            </section>
            <aside className="editorial-sidebar">
              {mustReads.length > 0 && (
                <section className="editorial-side-panel" aria-labelledby="popular-heading">
                  <p className="editorial-kicker">The reading list</p><h2 id="popular-heading">Popular this week</h2>
                  <ol className="editorial-ranking">{mustReads.slice(0, 5).map((post, index) => <li key={post._id}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><Link href={`/blog/${post.slug}`}>{post.title}</Link></li>)}</ol>
                </section>
              )}
              {sections.length > 0 && <section className="editorial-side-panel"><p className="editorial-kicker">Find your next read</p><h2>Editorial sections</h2><div className="editorial-section-links">{sections.map((section) => <Link key={section.slug} href={`/categories/${section.slug}`}>{section.title}<ArrowUpRight size={15} /></Link>)}</div></section>}
              <section className="editorial-rss"><p className="editorial-kicker">Keep reading</p><h2>A closer look at anime.</h2><p>New essays, character studies, and story breakdowns in your feed reader.</p><a href="/rss.xml">Follow via RSS <ArrowUpRight size={16} /></a></section>
            </aside>
          </div>

          {animeClusters.length > 0 && (
            <section className="editorial-section" aria-labelledby="explore-anime-heading">
              <div className="editorial-section-heading"><div><p className="editorial-kicker">Anime Series</p><h2 id="explore-anime-heading">Explore by Anime<span className="text-anime-red">.</span></h2></div></div>
              <div className="series-grid">{animeClusters.map((cluster, index) => (
                <Link key={cluster.name} href={`/tags/${encodeURIComponent(cluster.name)}`} className="series-card">
                  {cluster.cover?.asset?.url && <Image src={sanityImageUrl(cluster.cover, { width: 720, quality: 68 })} alt={cluster.cover.alt || ""} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px" className="object-cover" />}
                  <span className="series-number">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{cluster.name}</h3><p>{cluster.count} articles <ArrowUpRight size={16} /></p></div>
                </Link>
              ))}</div>
            </section>
          )}
          {trendingCollage.length > 0 && <div className="editorial-section"><TrendingRail posts={trendingCollage} /></div>}
        </div>
      </main>
      <Footer />
    </>
  );
}
