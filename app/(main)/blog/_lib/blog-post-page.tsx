import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cache, type ReactNode } from "react";

import {
  ArticleShareControls,
  ArticleToc,
  type ArticleTocItem,
} from "@/components/article/article-tools";
import { QuickAnswer, SpoilerNotice } from "@/components/article/editorial-components";
import { InlineRelatedBlog } from "@/components/article/inline-related";
import { EditorialCard } from "@/components/editorial-card";
import { AdBlock } from "@/components/ads/ad-block";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { FaqJsonLd } from "@/components/seo/faq-jsonld";
import {
  englishBlogBySlugQuery,
  englishFranchiseBlogsQuery,
  englishRelatedBlogsQuery,
  spanishBlogBySlugQuery,
  spanishFranchiseBlogsQuery,
  spanishRelatedBlogsQuery,
} from "@/sanity/blogQueries";
import { client, fetchArticleRelated } from "@/lib/content/client";
import { noteStaticArticleDiagnostic, timeStaticArticleStage, withStaticArticleDiagnostic } from "@/lib/content/static-article-diagnostic";
import { contentHeroImageUrl, contentImageUrl } from "@/lib/content/image";
import {
  defaultOgImage,
  getBaseUrl,
  siteAuthorName,
  siteAuthorUrl,
  siteName,
} from "@/utils/seo";

export const blogRevalidate = 60;
export type BlogLocale = "en" | "es";

type PortableTextSpan = { _type: string; text?: string };
type PortableTextBlock = {
  _key?: string;
  _type: string;
  style?: string;
  children?: PortableTextSpan[];
  [key: string]: unknown;
};

type Post = {
  _id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  body?: PortableTextBlock[];
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  _updatedAt?: string;
  articleType?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: {
    name?: string;
    slug?: string;
    bio?: PortableTextBlock[];
    image?: { asset?: { url?: string } };
  };
  sources?: { name?: string; url?: string }[];
  updateHistory?: { date?: string; summary?: string }[];
  animeName?: string;
  faq?: { question?: string; answer?: string }[];
  resolvedLocale: BlogLocale;
  alternateSlug?: string;
};

type RelatedPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

type RenderedBodyMarker = {
  index: number;
  type: "opening-ad" | "mid-content" | "inline-related";
};

type LocaleCopy = {
  dateLocale: string;
  homeLabel: string;
  blogsLabel: string;
  languageLabel: string;
  shareLabel: string;
  copyLabel: string;
  copiedLabel: string;
  tocHeading: string;
  faqHeading: string;
  sourcesHeading: string;
  sourcesCount: (count: number) => string;
  updateHistoryHeading: string;
  tagsHeading: string;
  authorHeading: string;
  authorRole: string;
  continueHeading: string;
  relatedHeading: string;
  updatedLabel: string;
  publishedLabel: string;
  readTimeLabel: (minutes: number) => string;
  spoilerLabel: string;
  quickAnswerLabel: string;
  inlineRelatedHeading: string;
  inlineRelatedKicker: string;
  readArticleLabel: string;
};

const localeCopy: Record<BlogLocale, LocaleCopy> = {
  en: {
    dateLocale: "en-US",
    homeLabel: "Home",
    blogsLabel: "Blogs",
    languageLabel: "Language",
    shareLabel: "Share",
    copyLabel: "Copy link",
    copiedLabel: "Copied",
    tocHeading: "In this article",
    faqHeading: "Frequently asked questions",
    sourcesHeading: "Sources & references",
    sourcesCount: (count) => `${count} ${count === 1 ? "source" : "sources"}`,
    updateHistoryHeading: "Update history",
    tagsHeading: "Filed under",
    authorHeading: "About the author",
    authorRole: "Anime critic",
    continueHeading: "Continue reading",
    relatedHeading: "Related reading",
    updatedLabel: "Updated",
    publishedLabel: "Originally published",
    readTimeLabel: (minutes) => `${minutes} min read`,
    spoilerLabel: "Spoiler level",
    quickAnswerLabel: "Quick answer",
    inlineRelatedHeading: "More blogs like this",
    inlineRelatedKicker: "Related post",
    readArticleLabel: "Read article",
  },
  es: {
    dateLocale: "es-ES",
    homeLabel: "Inicio",
    blogsLabel: "Articulos",
    languageLabel: "Idioma",
    shareLabel: "Compartir",
    copyLabel: "Copiar enlace",
    copiedLabel: "Copiado",
    tocHeading: "En este articulo",
    faqHeading: "Preguntas frecuentes",
    sourcesHeading: "Fuentes y referencias",
    sourcesCount: (count) => `${count} ${count === 1 ? "fuente" : "fuentes"}`,
    updateHistoryHeading: "Historial de actualizaciones",
    tagsHeading: "Archivado en",
    authorHeading: "Sobre el autor",
    authorRole: "Critico de anime",
    continueHeading: "Sigue leyendo",
    relatedHeading: "Lecturas relacionadas",
    updatedLabel: "Actualizado",
    publishedLabel: "Publicado originalmente",
    readTimeLabel: (minutes) => `${minutes} min de lectura`,
    spoilerLabel: "Nivel de spoilers",
    quickAnswerLabel: "Respuesta rapida",
    inlineRelatedHeading: "Más artículos como este",
    inlineRelatedKicker: "Artículo relacionado",
    readArticleLabel: "Leer artículo",
  },
};

const spoilerPrefix = /^(spoiler warning|advertencia de spoilers?)\s*[:\u2014-]\s*/i;
const quickAnswerHeading = /^(the\s+)?(short|simple)\s+(answer|version)$/i;

const getDescription = (metaDescription?: string, excerpt?: string) => {
  const source = metaDescription || excerpt;
  if (!source) return undefined;
  const trimmed = source.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

const getBlogPath = (locale: BlogLocale, slug: string) =>
  locale === "es" ? `/es/blog/${slug}` : `/blog/${slug}`;
const getBlogArchivePath = (locale: BlogLocale) =>
  locale === "es" ? "/blogs/es" : "/blogs";
const getBlogUrl = (baseUrl: string, locale: BlogLocale, slug: string) =>
  `${baseUrl}${getBlogPath(locale, slug)}`;

const formatPublishedDate = (value: string, locale: BlogLocale) =>
  new Intl.DateTimeFormat(localeCopy[locale].dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const isSameDay = (a?: string, b?: string) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    !Number.isNaN(da.getTime()) &&
    !Number.isNaN(db.getTime()) &&
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const getBlockText = (block?: PortableTextBlock) =>
  (block?.children || [])
    .map((child) => (typeof child?.text === "string" ? child.text : ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

const getPlainText = (blocks?: PortableTextBlock[]) =>
  (blocks || []).map((block) => getBlockText(block)).filter(Boolean).join("\n\n");

const slugifyHeading = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";

const getTocData = (blocks: PortableTextBlock[]) => {
  const counts = new Map<string, number>();
  const idByKey = new Map<string, string>();
  const items: ArticleTocItem[] = [];

  blocks.forEach((block) => {
    if (block._type !== "block" || (block.style !== "h2" && block.style !== "h1")) return;
    const label = getBlockText(block);
    if (!label) return;
    const baseId = slugifyHeading(label);
    const seen = counts.get(baseId) || 0;
    counts.set(baseId, seen + 1);
    const id = seen ? `${baseId}-${seen + 1}` : baseId;
    if (block._key) idByKey.set(block._key, id);
    items.push({ id, label, index: items.length + 1 });
  });

  return { items, idByKey };
};

const getQuickAnswerParagraphKeys = (blocks: PortableTextBlock[]) => {
  const keys = new Set<string>();

  blocks.forEach((block, index) => {
    if (
      block._type !== "block" ||
      (block.style !== "h2" && block.style !== "h1") ||
      !quickAnswerHeading.test(getBlockText(block))
    ) return;

    for (let cursor = index + 1; cursor < blocks.length; cursor += 1) {
      const candidate = blocks[cursor];
      if (candidate._type === "block" && /^h[1-4]$/.test(candidate.style || "")) break;
      if (
        candidate._type === "block" &&
        (!candidate.style || candidate.style === "normal") &&
        candidate._key &&
        getBlockText(candidate)
      ) {
        keys.add(candidate._key);
        break;
      }
    }
  });

  return keys;
};

const isParagraphBlock = (block: PortableTextBlock) => {
  if (
    block?._type !== "block" ||
    (block.style && block.style !== "normal") ||
    !Array.isArray(block.children)
  ) return false;
  const text = getBlockText(block);
  return Boolean(text) && !spoilerPrefix.test(text);
};

const getParagraphInsertIndex = (
  body: PortableTextBlock[],
  minParagraphs = 1,
  preferredParagraphs = minParagraphs,
) => {
  const totalParagraphs = body.filter(isParagraphBlock).length;
  if (totalParagraphs < minParagraphs) return null;
  const targetParagraph =
    totalParagraphs >= preferredParagraphs ? preferredParagraphs : minParagraphs;
  let seenParagraphs = 0;
  for (let index = 0; index < body.length; index += 1) {
    if (isParagraphBlock(body[index])) seenParagraphs += 1;
    if (seenParagraphs === targetParagraph) return index + 1;
  }
  return null;
};

const getMidContentInsertIndex = (body: PortableTextBlock[]) => {
  const headings = body
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block._type === "block" && block.style === "h2");
  if (headings.length >= 6) return headings[Math.floor(headings.length / 2)].index;
  return getParagraphInsertIndex(body, 9, 10);
};

const getInlineRelatedInsertIndex = (
  body: PortableTextBlock[],
  openingAdIndex: number | null,
  midContentInsertIndex: number | null,
) => {
  const candidates = [
    getParagraphInsertIndex(body, 5, 6),
    getParagraphInsertIndex(body, 4, 5),
    getParagraphInsertIndex(body, 6, 7),
    getParagraphInsertIndex(body, 3, 3),
  ];

  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate !== openingAdIndex &&
      candidate !== midContentInsertIndex
    ) {
      return candidate;
    }
  }

  return null;
};

const getReadingTime = (body: PortableTextBlock[]) => {
  const words = getPlainText(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

const getSourceDomain = (url?: string) => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

const getPost = cache(async (slug: string, locale: BlogLocale) =>
  timeStaticArticleStage("content-provider.primary-article", () => client.fetch<Post | null>(
    locale === "es" ? spanishBlogBySlugQuery : englishBlogBySlugQuery,
    { slug },
  )),
);
export async function generateBlogMetadata({ slug, locale }: { slug: string; locale: BlogLocale }): Promise<Metadata> {
  return withStaticArticleDiagnostic(slug, () => timeStaticArticleStage("generateMetadata", () => buildBlogMetadata({ slug, locale })));
}

async function buildBlogMetadata({ slug, locale }: { slug: string; locale: BlogLocale }): Promise<Metadata> {
  if (!slug) return {};
  const post = await getPost(slug, locale);
  if (!post?._id) return { title: "Post Not Found" };

  const baseUrl = getBaseUrl();
  const seoTitle = (post.metaTitle || "").trim() || post.title;
  const canonical = getBlogUrl(baseUrl, post.resolvedLocale, post.slug);
  const description = getDescription(post.metaDescription, post.excerpt) || `Read ${post.title} on ${siteName}.`;
  const mainImageUrl = post.mainImage?.asset ? contentHeroImageUrl(post.mainImage) : undefined;
  const ogImage = mainImageUrl || new URL(defaultOgImage, baseUrl).toString();
  const englishUrl = post.resolvedLocale === "en" ? canonical : post.alternateSlug ? getBlogUrl(baseUrl, "en", post.alternateSlug) : undefined;
  const spanishUrl = post.resolvedLocale === "es" ? canonical : post.alternateSlug ? getBlogUrl(baseUrl, "es", post.alternateSlug) : undefined;
  const languages = englishUrl && spanishUrl
    ? { en: englishUrl, es: spanishUrl, "x-default": englishUrl }
    : post.resolvedLocale === "en"
      ? { en: canonical, "x-default": canonical }
      : { es: canonical, "x-default": canonical };

  return {
    title: seoTitle,
    description,
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: seoTitle,
      description,
      url: canonical,
      type: "article",
      siteName,
      locale: post.resolvedLocale === "es" ? "es_ES" : "en_US",
      images: [{ url: ogImage }],
    },
    twitter: { card: "summary_large_image", title: seoTitle, description, images: [ogImage] },
  };
}

export async function BlogPostPage({ slug, locale }: { slug: string; locale: BlogLocale }) {
  return withStaticArticleDiagnostic(slug, async () => {
    noteStaticArticleDiagnostic("analytics.view-count", { status: "not-called-by-article-page" });
    noteStaticArticleDiagnostic("external-api-fetch", { status: "none-in-article-server-render-path" });
    noteStaticArticleDiagnostic("image-metadata-probe", { status: "none; Next Image URLs are serialized without probing" });
    return timeStaticArticleStage("page-component", () => renderBlogPostPage({ slug, locale }));
  });
}

async function renderBlogPostPage({ slug, locale }: { slug: string; locale: BlogLocale }) {
  const post = await getPost(slug, locale);
  if (!post?._id) return notFound();

  const baseUrl = getBaseUrl();
  const contentUi = localeCopy[post.resolvedLocale];
  const seoTitle = (post.metaTitle || "").trim() || post.title;
  const canonicalUrl = getBlogUrl(baseUrl, post.resolvedLocale, post.slug);
  const description = getDescription(post.metaDescription, post.excerpt) || `Read ${post.title} on ${siteName}.`;
  const mainImageUrl = post.mainImage?.asset ? contentHeroImageUrl(post.mainImage) : undefined;
  const faqItems = post.faq
    ?.map((item) => ({ question: item.question?.trim() || "", answer: item.answer?.trim() || "" }))
    .filter((item) => item.question && item.answer) || [];
  const categoryIds = (post.categories || []).map((category) => category?._id).filter(Boolean);
  const postTags = (post.tags || []).map((tag) => tag?.trim()).filter(Boolean);
  const effectiveUpdatedAt = post.updatedAt ||
    (post._updatedAt && post.publishedAt && post._updatedAt > post.publishedAt ? post._updatedAt : undefined);
  const showUpdatedDate = Boolean(effectiveUpdatedAt) && !isSameDay(effectiveUpdatedAt, post.publishedAt);

  const { franchise: franchiseBlogs, related } = await timeStaticArticleStage("related.content-provider-query", () => fetchArticleRelated<RelatedPost>({
    locale: post.resolvedLocale,
    animeName: post.animeName,
    currentId: post._id,
    categoryIds,
    tags: postTags,
    franchiseQuery: post.resolvedLocale === "es" ? spanishFranchiseBlogsQuery : englishFranchiseBlogsQuery,
    topicalQuery: post.resolvedLocale === "es" ? spanishRelatedBlogsQuery : englishRelatedBlogsQuery,
  }));

  const allRelatedMap = new Map<string, RelatedPost>();
  for (const item of [...franchiseBlogs, ...related]) {
    if (item?._id && item._id !== post._id && !allRelatedMap.has(item._id)) {
      allRelatedMap.set(item._id, item);
    }
  }
  const allRelated = Array.from(allRelatedMap.values());

  const inlineRelated = allRelated.slice(0, 1);
  const inlineRelatedIds = new Set(inlineRelated.map((item) => item._id));
  const remainingRelated = allRelated.filter((item) => !inlineRelatedIds.has(item._id));
  const sidebarRelated = remainingRelated.slice(0, 2);
  const continueReading = (remainingRelated.length >= 3 ? remainingRelated : allRelated).slice(0, 3);

  const bodyBlocks = Array.isArray(post.body) ? post.body : [];
  const { items: tocItems, idByKey: headingIdByKey } = getTocData(bodyBlocks);
  const sectionIndexById = new Map(tocItems.map((item) => [item.id, item.index]));
  const quickAnswerParagraphKeys = getQuickAnswerParagraphKeys(bodyBlocks);
  const readingTime = getReadingTime(bodyBlocks);
  const openingAdIndex = getParagraphInsertIndex(bodyBlocks, 2, 3);
  const midContentInsertIndex = getMidContentInsertIndex(bodyBlocks);
  const sourceItems = (post.sources || []).filter((source) => source.name?.trim() || source.url?.trim());
  const updateHistoryItems = (post.updateHistory || [])
    .filter((item) => item.date && item.summary?.trim())
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const authorName = post.author?.name || siteAuthorName;
  const authorBio = getPlainText(post.author?.bio);
  const animeTagExists = Boolean(post.animeName && postTags.some((tag) => tag.toLowerCase() === post.animeName?.toLowerCase()));

  const renderSectionHeading = ({ children, value }: { children?: ReactNode; value: unknown }) => {
    const block = value as PortableTextBlock;
    const label = getBlockText(block);
    const id = (block._key && headingIdByKey.get(block._key)) || slugifyHeading(label);
    const sectionNumber = sectionIndexById.get(id);
    if (quickAnswerHeading.test(label)) {
      return <h2 id={id} className="sr-only scroll-mt-24">{children}</h2>;
    }
    return (
      <h2 id={id} className="article-section-heading">
        {sectionNumber ? (
          <span className="article-section-number" aria-hidden="true">
            {String(sectionNumber).padStart(2, "0")}
          </span>
        ) : null}
        {children}
      </h2>
    );
  };

  const portableTextComponents: PortableTextComponents = {
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null;
        const src = contentImageUrl(value, { width: 1200 });
        if (!src) return null;
        return (
          <figure className="my-9">
            <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-[#0b0b0b]">
              <Image src={src} alt={typeof value.alt === "string" ? value.alt : ""} fill sizes="(max-width: 768px) 100vw, 736px" className="object-cover" loading="lazy" quality={75} />
            </div>
            {typeof value.alt === "string" && value.alt ? <figcaption className="mt-2 text-center text-sm leading-relaxed text-white/40">{value.alt}</figcaption> : null}
          </figure>
        );
      },
    },
    marks: {
      link: ({ children, value }) => {
        const href = typeof value?.href === "string" ? value.href : "";
        if (!href) return <>{children}</>;
        try {
          const target = new URL(href, baseUrl);
          const site = new URL(baseUrl);
          if (target.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "")) {
            return <Link href={`${target.pathname}${target.search}${target.hash}`} className="font-semibold text-white underline decoration-[#f20d0d] decoration-2 underline-offset-4 transition-colors hover:text-[#ccff00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ccff00]">{children}</Link>;
          }
        } catch {
          return <>{children}</>;
        }
        return <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline decoration-[#f20d0d] decoration-2 underline-offset-4 transition-colors hover:text-[#ccff00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ccff00]">{children}</a>;
      },
    },
    block: {
      h1: renderSectionHeading,
      h2: renderSectionHeading,
      h3: ({ children, value }) => <h3 id={slugifyHeading(getBlockText(value as PortableTextBlock))} className="mt-10 scroll-mt-24 text-xl font-black leading-snug text-white sm:text-2xl">{children}</h3>,
      h4: ({ children }) => <h4 className="mt-8 scroll-mt-24 text-lg font-bold leading-snug text-white sm:text-xl">{children}</h4>,
      normal: ({ children, value }) => {
        const block = value as PortableTextBlock;
        const text = getBlockText(block);
        if (spoilerPrefix.test(text)) {
          return <SpoilerNotice label={contentUi.spoilerLabel}>{text.replace(spoilerPrefix, "")}</SpoilerNotice>;
        }
        if (block._key && quickAnswerParagraphKeys.has(block._key)) {
          return <QuickAnswer label={contentUi.quickAnswerLabel}>{children}</QuickAnswer>;
        }
        return <p className="mb-6 text-[1.0625rem] leading-[1.82] text-white/76 sm:text-lg">{children}</p>;
      },
      blockquote: ({ children }) => <blockquote className="my-9 border-l-2 border-[#f20d0d] bg-white/[0.035] px-5 py-4 text-lg italic leading-relaxed text-white/70 sm:px-6">{children}</blockquote>,
    },
    list: {
      bullet: ({ children }) => <ul className="my-6 list-disc space-y-2 pl-6 marker:text-[#f20d0d]">{children}</ul>,
      number: ({ children }) => <ol className="my-6 list-decimal space-y-2 pl-6 marker:font-bold marker:text-[#f20d0d]">{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li className="pl-1 text-[1.0625rem] leading-relaxed text-white/76 sm:text-lg">{children}</li>,
      number: ({ children }) => <li className="pl-1 text-[1.0625rem] leading-relaxed text-white/76 sm:text-lg">{children}</li>,
    },
  };

  const inlineRelatedIndex =
    inlineRelated.length > 0
      ? getInlineRelatedInsertIndex(bodyBlocks, openingAdIndex, midContentInsertIndex)
      : null;

  const markers: RenderedBodyMarker[] = [
    openingAdIndex !== null ? { index: openingAdIndex, type: "opening-ad" as const } : null,
    inlineRelatedIndex !== null ? { index: inlineRelatedIndex, type: "inline-related" as const } : null,
    midContentInsertIndex !== null &&
    midContentInsertIndex !== openingAdIndex &&
    midContentInsertIndex !== inlineRelatedIndex
      ? { index: midContentInsertIndex, type: "mid-content" as const }
      : null,
  ].filter((marker): marker is RenderedBodyMarker => marker !== null).sort((left, right) => left.index - right.index);

  const articleBodyContent: ReactNode[] = [];
  let currentBodyIndex = 0;
  for (const marker of markers) {
    const segment = bodyBlocks.slice(currentBodyIndex, marker.index);
    if (segment.length) {
      articleBodyContent.push(<PortableText key={`body-${currentBodyIndex}-${marker.index}`} value={segment} components={portableTextComponents} />);
    }
    if (marker.type === "inline-related") {
      articleBodyContent.push(
        <InlineRelatedBlog
          key="inline-related-blog"
          posts={inlineRelated}
          locale={post.resolvedLocale}
          heading={contentUi.inlineRelatedHeading}
          kicker={contentUi.inlineRelatedKicker}
          readLabel={contentUi.readArticleLabel}
        />
      );
    } else {
      articleBodyContent.push(<AdBlock key={`ad-${marker.type}`} className="my-12" instanceId={`${post._id}-${marker.type}`} />);
    }
    currentBodyIndex = marker.index;
  }
  if (currentBodyIndex < bodyBlocks.length) {
    articleBodyContent.push(<PortableText key={`body-${currentBodyIndex}-end`} value={bodyBlocks.slice(currentBodyIndex)} components={portableTextComponents} />);
  }

  const englishVersionPath = post.resolvedLocale === "en" ? getBlogPath("en", post.slug) : post.alternateSlug ? getBlogPath("en", post.alternateSlug) : null;
  const spanishVersionPath = post.resolvedLocale === "es" ? getBlogPath("es", post.slug) : post.alternateSlug ? getBlogPath("es", post.alternateSlug) : null;

  return (
    <main lang={post.resolvedLocale} className="blog-page article-detail min-h-screen bg-[#050505] text-[#f0f0f0]">
      <ArticleJsonLd
        url={canonicalUrl}
        title={seoTitle}
        description={description}
        image={mainImageUrl}
        datePublished={post.publishedAt}
        dateModified={effectiveUpdatedAt}
        authorName={authorName}
        authorUrl={siteAuthorUrl}
        authorImage={post.author?.image?.asset?.url}
        authorSameAs={[siteAuthorUrl]}
        publisherUrl={baseUrl}
        publisherLogo={`${baseUrl}/logo.png`}
        articleSection={post.categories?.map((category) => category.title).filter(Boolean)}
        about={post.animeName ? { "@type": "Thing", name: post.animeName } : undefined}
        inLanguage={post.resolvedLocale}
      />
      <BreadcrumbsJsonLd items={[
        { name: contentUi.homeLabel, item: `${baseUrl}/` },
        { name: contentUi.blogsLabel, item: `${baseUrl}${getBlogArchivePath(post.resolvedLocale)}` },
        { name: post.title, item: canonicalUrl },
      ]} />
      {faqItems.length ? <FaqJsonLd items={faqItems} /> : null}

      <div className="editorial-shell article-utility">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-3">
            <li><Link href="/">{contentUi.homeLabel}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={getBlogArchivePath(post.resolvedLocale)}>{contentUi.blogsLabel}</Link></li>
            {post.categories?.[0] && <><li aria-hidden="true">/</li><li><Link href={`/categories/${post.categories[0].slug}`}>{post.categories[0].title}</Link></li></>}
          </ol>
        </nav>
        <nav aria-label={contentUi.languageLabel} className="article-editions">
          {englishVersionPath && <Link href={englishVersionPath} hrefLang="en" aria-current={post.resolvedLocale === "en" ? "page" : undefined}>EN</Link>}
          {spanishVersionPath && <Link href={spanishVersionPath} hrefLang="es" aria-current={post.resolvedLocale === "es" ? "page" : undefined}>ES</Link>}
        </nav>
      </div>

      <header className={`article-hero ${mainImageUrl ? "article-hero--illustrated" : ""}`}>
        {mainImageUrl && <div className="article-hero-art"><Image src={mainImageUrl} alt={post.mainImage?.alt || post.title} fill priority fetchPriority="high" sizes="100vw" quality={72} className="object-cover" /></div>}
        <div className="editorial-shell article-hero-inner">
          <div className="article-hero-copy">
            <div className="article-classification">
              {(post.categories || []).slice(0, 2).map((category) => <Link key={category.slug} href={`/categories/${category.slug}`}>{category.title}</Link>)}
              {post.articleType && <span>{post.articleType.replace(/-/g, " ")}</span>}
            </div>
            <h1>{post.title}</h1>
            {post.excerpt && <p className="article-deck">{post.excerpt}</p>}
            <div className="article-hero-footnote">
              <span className="article-read-time">{contentUi.readTimeLabel(readingTime)}</span>
              {post.animeName && (animeTagExists ? <Link href={`/tags/${encodeURIComponent(post.animeName)}`}>{post.animeName}<ArrowUpRight size={14} /></Link> : <span>{post.animeName}</span>)}
            </div>
          </div>
        </div>
      </header>

      <div className="editorial-shell article-byline-bar">
        <div className="article-byline">
          <div className="article-avatar">
            {post.author?.image?.asset?.url ? <Image src={post.author.image.asset.url} alt={authorName} fill sizes="42px" className="object-cover" /> : <span>{authorName.charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <a href="#article-author-heading" className="article-byline-name">{authorName}</a>
            <p>
              {showUpdatedDate && effectiveUpdatedAt ? (
                <>{contentUi.updatedLabel} <time dateTime={effectiveUpdatedAt}>{formatPublishedDate(effectiveUpdatedAt, post.resolvedLocale)}</time>{post.publishedAt ? <> · {contentUi.publishedLabel} <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt, post.resolvedLocale)}</time></> : null}</>
              ) : post.publishedAt ? <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt, post.resolvedLocale)}</time> : null}
            </p>
          </div>
        </div>
        <ArticleShareControls title={post.title} url={canonicalUrl} shareLabel={contentUi.shareLabel} copyLabel={contentUi.copyLabel} copiedLabel={contentUi.copiedLabel} />
      </div>

      <div className="editorial-shell article-reading-layout">
        <div className="lg:hidden"><ArticleToc items={tocItems} heading={contentUi.tocHeading} /></div>

        <div className="article-reading-grid">
          <article className="article-reading-column" lang={post.resolvedLocale}>
            <div className="blogContent article-copy article-reading-copy">{articleBodyContent}</div>

            {postTags.length ? (
              <section className="mt-12 border-t border-white/10 pt-5" aria-labelledby="article-tags-heading">
                <h2 id="article-tags-heading" className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">{contentUi.tagsHeading}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/55">
                  {postTags.map((tag) => <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="transition-colors hover:text-[#ccff00] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ccff00]">#{tag}</Link>)}
                </div>
              </section>
            ) : null}

            {faqItems.length ? (
              <>
                <AdBlock className="mb-0 mt-12" instanceId={`${post._id}-before-faq`} />
                <section className="article-reference-panel" aria-labelledby="article-faq-heading">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#f20d0d]">FAQ</p>
                  <h2 id="article-faq-heading" className="text-2xl font-black tracking-tight text-white sm:text-3xl">{contentUi.faqHeading}</h2>
                  <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                    {faqItems.map((item, index) => (
                      <details key={`${item.question}-${index}`} className="group py-1">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 text-base font-bold leading-snug text-white marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ccff00]">
                          <span>{item.question}</span><ChevronDown className="mt-0.5 size-4 shrink-0 text-[#f20d0d] transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <p className="max-w-[65ch] pb-5 text-base leading-relaxed text-white/65">{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {sourceItems.length ? (
              <section className="mt-10 border-y border-white/12 py-4" aria-labelledby="article-sources-heading">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 marker:hidden [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ccff00]">
                    <h2 id="article-sources-heading" className="min-w-0 flex-1 text-sm font-semibold text-white/85 sm:text-base">{contentUi.sourcesHeading}</h2>
                    <span className="shrink-0 text-xs text-white/45">{contentUi.sourcesCount(sourceItems.length)}</span>
                    <ChevronDown className="size-4 shrink-0 text-white/45 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                  </summary>
                  <ol className="mt-4 border-t border-white/8 pt-2">
                    {sourceItems.map((source, index) => (
                      <li key={`${source.url || source.name}-${index}`} className="flex items-baseline gap-3 py-2 text-sm">
                        <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-white/35" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-baseline justify-between gap-3 leading-relaxed text-white/70 transition-colors hover:text-[#ccff00] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ccff00]">
                            <span className="min-w-0 [overflow-wrap:anywhere]">{source.name || getSourceDomain(source.url)}</span>
                            <ArrowUpRight className="size-3.5 shrink-0 self-center" aria-hidden="true" />
                          </a>
                        ) : <span className="min-w-0 leading-relaxed text-white/60 [overflow-wrap:anywhere]">{source.name}</span>}
                      </li>
                    ))}
                  </ol>
                </details>
              </section>
            ) : null}

            {updateHistoryItems.length ? (
              <section className="mt-8 border-t border-white/10 pt-6" aria-labelledby="article-update-history-heading">
                <h2 id="article-update-history-heading" className="text-sm font-black uppercase tracking-[0.16em] text-white/55">{contentUi.updateHistoryHeading}</h2>
                <ol className="mt-4 space-y-4">
                  {updateHistoryItems.map((item, index) => (
                    <li key={`${item.date}-${index}`} className="grid gap-1 border-l border-[#f20d0d]/50 pl-4 text-sm sm:grid-cols-[9rem_1fr] sm:gap-4">
                      <time dateTime={item.date} className="font-mono text-xs text-white/35">{formatPublishedDate(item.date!, post.resolvedLocale)}</time>
                      <p className="leading-relaxed text-white/60">{item.summary}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="article-author-panel" aria-labelledby="article-author-heading">
              <p className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">{contentUi.authorHeading}</p>
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/8 sm:size-16">
                  {post.author?.image?.asset?.url ? <Image src={post.author.image.asset.url} alt={authorName} fill sizes="64px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-lg font-black text-white/65">{authorName.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="min-w-0">
                  <h2 id="article-author-heading" className="text-lg font-black text-white">{authorName}</h2>
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.14em] text-[#f20d0d]">{contentUi.authorRole}</p>
                  {authorBio ? <p className="mt-3 max-w-[62ch] whitespace-pre-line text-sm leading-relaxed text-white/55">{authorBio}</p> : null}
                </div>
              </div>
            </section>

          </article>

          <aside className="article-aside">
            <section className="article-sidebar-author">
              <p className="editorial-kicker">{contentUi.authorHeading}</p>
              <div className="article-sidebar-author-name">
                <div className="article-avatar">
                  {post.author?.image?.asset?.url ? <Image src={post.author.image.asset.url} alt={authorName} fill sizes="42px" className="object-cover" /> : <span>{authorName.charAt(0).toUpperCase()}</span>}
                </div>
                <div><a href="#article-author-heading">{authorName}</a><p>{contentUi.authorRole}</p></div>
              </div>
            </section>
            <div className="article-sidebar-sticky">
              <ArticleToc items={tocItems} heading={contentUi.tocHeading} />
              {sidebarRelated.length ? (
                <section className="article-sidebar-related" aria-labelledby="sidebar-related-heading">
                  <h2 id="sidebar-related-heading" className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/45">{contentUi.relatedHeading}</h2>
                  <div className="space-y-4">
                    {sidebarRelated.map((item) => (
                      <Link key={item._id} href={getBlogPath(post.resolvedLocale, item.slug)} className="group block border-b border-white/8 pb-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ccff00]">
                        <p className="text-sm font-bold leading-snug text-white/72 transition-colors group-hover:text-[#ccff00]">{item.title}</p>
                        {item.publishedAt ? <p className="mt-2 text-[11px] text-white/30">{formatPublishedDate(item.publishedAt, post.resolvedLocale)}</p> : null}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </aside>
        </div>
        {continueReading.length > 0 && (
          <section className="article-next-stories" aria-labelledby="continue-reading-heading">
            <div className="editorial-section-heading">
              <div><p className="editorial-kicker">{post.animeName || contentUi.relatedHeading}</p><h2 id="continue-reading-heading">{contentUi.continueHeading}<span className="text-anime-red">.</span></h2></div>
              <Link href={getBlogArchivePath(post.resolvedLocale)}>{contentUi.blogsLabel}<ArrowUpRight size={16} /></Link>
            </div>
            <div className="editorial-grid">{continueReading.map((item) => <EditorialCard key={item._id} post={item} locale={post.resolvedLocale} />)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
