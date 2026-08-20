import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { cache, type ReactNode } from "react";

import { AdBlock } from "@/components/ads/ad-block";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { FaqJsonLd } from "@/components/seo/faq-jsonld";
import { fetchGaPageView } from "@/lib/analytics";
import {
  englishBlogBySlugQuery,
  englishBlogSlugsQuery,
  englishRelatedBlogsQuery,
  spanishBlogBySlugQuery,
  spanishBlogSlugsQuery,
  spanishRelatedBlogsQuery,
} from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import {
  defaultOgImage,
  getBaseUrl,
  siteAuthorName,
  siteAuthorUrl,
  siteName,
} from "@/utils/seo";

export const blogRevalidate = 60;

export type BlogLocale = "en" | "es";

type PortableTextSpan = {
  _type: string;
  text?: string;
};

type PortableTextBlock = {
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
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { _id: string; title: string; slug: string }[];
  author?: { name?: string; slug?: string };
  faq?: { question?: string; answer?: string }[];
  resolvedLocale: BlogLocale;
  alternateSlug?: string;
};

type RelatedPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
};

type BlogSlug = {
  slug: string;
};

type RenderedBodyMarker = {
  index: number;
  type: "after-first-paragraph" | "mid-content" | "inline-related";
};

type LocaleCopy = {
  contentLanguage: BlogLocale;
  dateLocale: string;
  languageLabel: string;
  homeLabel: string;
  blogsLabel: string;
  shareLabel: string;
  viewsLabel: string;
  relatedHeading: string;
  relatedEyebrow: string;
  tagsHeading: string;
  faqHeading: string;
  nextInLabel: (category?: string) => string;
  nextUpLabel: string;
  filedLabel: string;
  updatedLabel: string;
  readNextLabel: string;
  sidebarHeading: string;
  newsletterHeading: string;
  newsletterCopy: string;
  newsletterPlaceholder: string;
  newsletterCta: string;
  facebookShareLabel: string;
  twitterShareLabel: string;
};

const localeCopy: Record<BlogLocale, LocaleCopy> = {
  en: {
    contentLanguage: "en",
    dateLocale: "en-US",
    languageLabel: "Language",
    homeLabel: "Home",
    blogsLabel: "Blogs",
    shareLabel: "Share",
    viewsLabel: "views",
    relatedHeading: "More Blogs Like This",
    relatedEyebrow: "Related files",
    tagsHeading: "Tags",
    faqHeading: "Frequently Asked Questions",
    nextInLabel: (category) => `Next in ${category || "AnimeSparks"}`,
    nextUpLabel: "Next up",
    filedLabel: "Filed",
    updatedLabel: "Updated",
    readNextLabel: "Read next",
    sidebarHeading: "Related Blogs",
    newsletterHeading: "Subscribe to Our Newsletter",
    newsletterCopy: "Get the latest articles delivered straight to your inbox.",
    newsletterPlaceholder: "Your email address",
    newsletterCta: "Subscribe",
    facebookShareLabel: "Share on Facebook",
    twitterShareLabel: "Share on Twitter/X",
  },
  es: {
    contentLanguage: "es",
    dateLocale: "es-ES",
    languageLabel: "Idioma",
    homeLabel: "Inicio",
    blogsLabel: "Articulos",
    shareLabel: "Compartir",
    viewsLabel: "vistas",
    relatedHeading: "Mas articulos como este",
    relatedEyebrow: "Archivos relacionados",
    tagsHeading: "Etiquetas",
    faqHeading: "Preguntas frecuentes",
    nextInLabel: (category) => `Siguiente en ${category || "AnimeSparks"}`,
    nextUpLabel: "Sigue leyendo",
    filedLabel: "Publicado",
    updatedLabel: "Actualizado",
    readNextLabel: "Leer siguiente",
    sidebarHeading: "Articulos relacionados",
    newsletterHeading: "Suscribete al boletin",
    newsletterCopy: "Recibe los ultimos articulos directamente en tu correo.",
    newsletterPlaceholder: "Tu correo electronico",
    newsletterCta: "Suscribirse",
    facebookShareLabel: "Compartir en Facebook",
    twitterShareLabel: "Compartir en Twitter/X",
  },
};

const getDescription = (metaDescription?: string, excerpt?: string) => {
  const source = metaDescription || excerpt;
  if (!source) return undefined;
  const trimmed = source.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

const getBlogPath = (locale: BlogLocale, slug: string) =>
  locale === "es" ? `/blog/es/${slug}` : `/blog/${slug}`;

const getBlogArchivePath = (locale: BlogLocale) =>
  locale === "es" ? "/blogs/es" : "/blogs";

const getBlogUrl = (baseUrl: string, locale: BlogLocale, slug: string) =>
  `${baseUrl}${getBlogPath(locale, slug)}`;

const formatPublishedDate = (value: string, locale: BlogLocale) =>
  new Intl.DateTimeFormat(localeCopy[locale].dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));

const isParagraphBlock = (block: PortableTextBlock) => {
  if (
    block?._type !== "block" ||
    (block.style && block.style !== "normal") ||
    !Array.isArray(block.children)
  ) {
    return false;
  }

  const text = block.children
    .map((child) => (typeof child?.text === "string" ? child.text : ""))
    .join(" ")
    .trim();

  return Boolean(text);
};

const getParagraphInsertIndex = (
  body: PortableTextBlock[],
  minParagraphs = 1,
  preferredParagraphs = minParagraphs,
) => {
  let totalParagraphs = 0;

  for (const block of body) {
    if (isParagraphBlock(block)) {
      totalParagraphs += 1;
    }
  }

  if (totalParagraphs < minParagraphs) return null;

  const targetParagraph =
    totalParagraphs >= preferredParagraphs ? preferredParagraphs : minParagraphs;

  let seenParagraphs = 0;
  for (let i = 0; i < body.length; i += 1) {
    const block = body[i];
    if (isParagraphBlock(block)) {
      seenParagraphs += 1;
    }

    if (seenParagraphs === targetParagraph) {
      return i + 1;
    }
  }

  return null;
};

const getMidContentInsertIndex = (body: PortableTextBlock[]) => {
  const sectionHeadingIndexes: number[] = [];

  for (let i = 0; i < body.length; i += 1) {
    const block = body[i];

    if (
      block?._type === "block" &&
      (block.style === "h2" || block.style === "h3")
    ) {
      sectionHeadingIndexes.push(i);
    }
  }

  if (sectionHeadingIndexes.length >= 5) {
    return sectionHeadingIndexes[4];
  }

  if (sectionHeadingIndexes.length >= 4) {
    return sectionHeadingIndexes[3];
  }

  return getParagraphInsertIndex(body, 7, 8);
};

const isRenderedBodyMarker = (
  marker: RenderedBodyMarker | null,
): marker is RenderedBodyMarker => marker !== null;

const getPost = cache(async (slug: string, locale: BlogLocale) =>
  client.fetch<Post | null>(
    locale === "es" ? spanishBlogBySlugQuery : englishBlogBySlugQuery,
    { slug },
  ),
);

const getAllPostSlugs = cache(async (locale: BlogLocale) =>
  client.fetch<BlogSlug[]>(
    locale === "es" ? spanishBlogSlugsQuery : englishBlogSlugsQuery,
  ),
);

export async function generateBlogStaticParams(locale: BlogLocale) {
  const posts = await getAllPostSlugs(locale);

  return (posts ?? [])
    .map((post) => post.slug)
    .filter(Boolean)
    .map((slug) => ({ slug }));
}

export async function generateBlogMetadata({
  slug,
  locale,
}: {
  slug: string;
  locale: BlogLocale;
}): Promise<Metadata> {
  if (!slug) return {};

  const post = await getPost(slug, locale);
  if (!post?._id) {
    return { title: "Post Not Found" };
  }

  const baseUrl = getBaseUrl();
  const seoTitle = (post.metaTitle || "").trim() || post.title;
  const canonical = getBlogUrl(baseUrl, post.resolvedLocale, post.slug);
  const description =
    getDescription(post.metaDescription, post.excerpt) ||
    `Read ${post.title} on ${siteName}.`;
  const mainImageUrl = post.mainImage?.asset
    ? sanityHeroImageUrl(post.mainImage)
    : undefined;
  const ogImage = mainImageUrl || new URL(defaultOgImage, baseUrl).toString();
  const englishUrl =
    post.resolvedLocale === "en"
      ? canonical
      : post.alternateSlug
        ? getBlogUrl(baseUrl, "en", post.alternateSlug)
        : undefined;
  const spanishUrl =
    post.resolvedLocale === "es"
      ? canonical
      : post.alternateSlug
        ? getBlogUrl(baseUrl, "es", post.alternateSlug)
        : undefined;
  const languages =
    englishUrl && spanishUrl
      ? { en: englishUrl, es: spanishUrl, "x-default": englishUrl }
      : post.resolvedLocale === "en"
        ? { en: canonical, "x-default": canonical }
        : { es: canonical, "x-default": canonical };

  return {
    title: seoTitle,
    description,
    alternates: {
      canonical,
      languages,
    },
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
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: [ogImage],
    },
  };
}

export async function BlogPostPage({
  slug,
  locale,
}: {
  slug: string;
  locale: BlogLocale;
}) {
  const post = await getPost(slug, locale);

  if (!post?._id) return notFound();

  const baseUrl = getBaseUrl();
  const contentUi = localeCopy[post.resolvedLocale];
  const seoTitle = (post.metaTitle || "").trim() || post.title;
  const canonicalUrl = getBlogUrl(baseUrl, post.resolvedLocale, post.slug);
  const description =
    getDescription(post.metaDescription, post.excerpt) ||
    `Read ${post.title} on ${siteName}.`;
  const mainImageUrl = post.mainImage?.asset
    ? sanityHeroImageUrl(post.mainImage)
    : undefined;
  const faqItems =
    post.faq
      ?.map((item) => ({
        question: item.question?.trim() || "",
        answer: item.answer?.trim() || "",
      }))
      .filter((item) => item.question && item.answer) || [];

  const categoryIds = (post.categories || [])
    .map((category) => category?._id)
    .filter(Boolean);
  const postTags = (post.tags || []).map((tag) => tag?.trim()).filter(Boolean);
  const viewCount = await fetchGaPageView(slug);

  const effectiveUpdatedAt =
    post.updatedAt ||
    (post._updatedAt && post.publishedAt && post._updatedAt > post.publishedAt
      ? post._updatedAt
      : undefined);
  const showUpdatedDate =
    !!effectiveUpdatedAt && effectiveUpdatedAt !== post.publishedAt;

  const relatedLocale = post.resolvedLocale;
  const related =
    categoryIds.length > 0 || postTags.length > 0
      ? await client.fetch<RelatedPost[]>(
          relatedLocale === "es" ? spanishRelatedBlogsQuery : englishRelatedBlogsQuery,
          {
          currentId: post._id,
          categoryIds,
          tags: postTags,
          },
        )
      : [];
  const inlineRelated = related.slice(0, 1);
  const inlineRelatedIds = new Set(inlineRelated.map((item) => item._id));
  const nextBlog = related.find((item) => !inlineRelatedIds.has(item._id));
  const sidebarRelated = related.filter(
    (item) => item._id !== nextBlog?._id && !inlineRelatedIds.has(item._id),
  );

  const bodyBlocks = Array.isArray(post.body) ? post.body : [];
  const afterFirstParagraphIndex = getParagraphInsertIndex(bodyBlocks, 1);
  const inlineInsertIndex = getParagraphInsertIndex(bodyBlocks, 4, 5);
  const midContentInsertIndex = getMidContentInsertIndex(bodyBlocks);
  const showInlineRelated =
    inlineInsertIndex !== null && inlineRelated.length > 0;

  const portableTextComponents: PortableTextComponents = {
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null;
        const src = sanityImageUrl(value, { width: 1200 });

        return (
          <figure className="my-8">
            <div className="relative aspect-video w-full overflow-hidden rounded-sm">
              <Image
                src={src}
                alt={typeof value.alt === "string" ? value.alt : ""}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 768px, 860px"
                className="object-cover"
                loading="lazy"
                quality={75}
              />
            </div>
            {typeof value.alt === "string" && value.alt ? (
              <figcaption className="mt-2 text-center text-sm text-gray-500">
                {value.alt}
              </figcaption>
            ) : null}
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
            return (
              <Link
                href={`${target.pathname}${target.search}${target.hash}`}
                className="font-semibold text-red-700 underline decoration-red-300 underline-offset-4 transition-colors md:hover:text-red-900"
              >
                {children}
              </Link>
            );
          }
        } catch {
          return <>{children}</>;
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-red-700 underline decoration-red-300 underline-offset-4 transition-colors md:hover:text-red-900"
          >
            {children}
          </a>
        );
      },
    },
    block: {
      h2: ({ children }) => (
        <h2 className="mt-12 mb-4 text-3xl font-black tracking-tight text-gray-900">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mt-10 mb-3 text-2xl font-black text-gray-900">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mt-8 mb-2 text-xl font-bold text-gray-900">
          {children}
        </h4>
      ),
      normal: ({ children }) => (
        <p className="mb-6 text-lg leading-relaxed text-gray-800">{children}</p>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-8 border-l-4 border-red-600 bg-gray-50 pl-6 py-4 italic text-gray-700">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="my-6 list-disc list-outside space-y-2 pl-6">{children}</ul>
      ),
      number: ({ children }) => (
        <ol className="my-6 list-decimal list-outside space-y-2 pl-6">
          {children}
        </ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => (
        <li className="text-lg leading-relaxed text-gray-800 marker:text-gray-500">
          {children}
        </li>
      ),
      number: ({ children }) => (
        <li className="text-lg leading-relaxed text-gray-800 marker:text-gray-500">
          {children}
        </li>
      ),
    },
  };

  const renderedBodyMarkers = [
    afterFirstParagraphIndex !== null
      ? {
          index: afterFirstParagraphIndex,
          type: "after-first-paragraph" as const,
        }
      : null,
    midContentInsertIndex !== null &&
    midContentInsertIndex !== afterFirstParagraphIndex
      ? {
          index: midContentInsertIndex,
          type: "mid-content" as const,
        }
      : null,
    showInlineRelated && inlineInsertIndex !== null
      ? {
          index: inlineInsertIndex,
          type: "inline-related" as const,
        }
      : null,
  ]
    .filter(isRenderedBodyMarker)
    .sort((left, right) => {
      if (left.index !== right.index) {
        return left.index - right.index;
      }

      if (left.type === "inline-related") {
        return 1;
      }

      if (right.type === "inline-related") {
        return -1;
      }

      return 0;
    });

  const articleBodyContent: ReactNode[] = [];
  let currentBodyIndex = 0;

  for (const marker of renderedBodyMarkers) {
    const segment = bodyBlocks.slice(currentBodyIndex, marker.index);

    if (segment.length > 0) {
      articleBodyContent.push(
        <PortableText
          key={`body-${currentBodyIndex}-${marker.index}`}
          value={segment}
          components={portableTextComponents}
        />,
      );
    }

    if (marker.type === "after-first-paragraph") {
      articleBodyContent.push(
        <AdBlock
          key="ad-after-first-paragraph"
          instanceId={`${post._id}-after-first-paragraph`}
        />,
      );
    }

    if (marker.type === "mid-content") {
      articleBodyContent.push(
        <AdBlock
          key="ad-mid-content"
          instanceId={`${post._id}-mid-content`}
        />,
      );
    }

    if (marker.type === "inline-related") {
      articleBodyContent.push(
        <section
          key="inline-related"
          className="my-10 border border-gray-200 bg-gray-50 p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-base font-black uppercase tracking-tight text-gray-900 sm:text-lg">
              {contentUi.relatedHeading}
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              {contentUi.relatedEyebrow}
            </span>
          </div>

          <div className="grid gap-3">
            {inlineRelated.map((item) => (
              <Link
                key={item._id}
                href={getBlogPath(post.resolvedLocale, item.slug)}
                className="group block max-w-xl border border-gray-200 bg-white p-2.5 no-underline transition-colors sm:p-3 md:hover:border-red-600"
              >
                <div className="flex items-start gap-3">
                  {item.mainImage?.asset?.url ? (
                    <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded-sm bg-gray-200 sm:h-20 sm:w-32">
                      <Image
                        src={sanityImageUrl(item.mainImage, {
                          width: 420,
                          quality: 65,
                        })}
                        alt={item.mainImage.alt || item.title}
                        fill
                        sizes="(max-width: 768px) 120px, 140px"
                        className="object-cover transition-transform duration-300 md:group-hover:scale-105"
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0">
                    <h3 className="m-0 line-clamp-2 text-sm font-black leading-snug text-gray-900 transition-colors sm:text-base md:group-hover:text-red-600">
                      {item.title}
                    </h3>
                    {item.publishedAt ? (
                      <p className="mt-1.5 mb-0 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                        {formatPublishedDate(item.publishedAt, post.resolvedLocale)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>,
      );
    }

    currentBodyIndex = marker.index;
  }

  if (currentBodyIndex < bodyBlocks.length) {
    articleBodyContent.push(
      <PortableText
        key={`body-${currentBodyIndex}-end`}
        value={bodyBlocks.slice(currentBodyIndex)}
        components={portableTextComponents}
      />,
    );
  }
  const englishVersionPath =
    post.resolvedLocale === "en"
      ? getBlogPath("en", post.slug)
      : post.alternateSlug
        ? getBlogPath("en", post.alternateSlug)
        : null;
  const spanishVersionPath =
    post.resolvedLocale === "es"
      ? getBlogPath("es", post.slug)
      : post.alternateSlug
        ? getBlogPath("es", post.alternateSlug)
        : null;

  return (
    <main
      lang={post.resolvedLocale}
      className="blog-page min-h-screen bg-[#050505] text-[#f0f0f0]"
    >
      <ArticleJsonLd
        url={canonicalUrl}
        title={seoTitle}
        description={description}
        image={mainImageUrl}
        datePublished={post.publishedAt}
        dateModified={effectiveUpdatedAt}
        authorName={post.author?.name || siteAuthorName}
        authorUrl={siteAuthorUrl}
        inLanguage={post.resolvedLocale}
      />
      <BreadcrumbsJsonLd
        items={[
          { name: contentUi.homeLabel, item: `${baseUrl}/` },
          {
            name: contentUi.blogsLabel,
            item: `${baseUrl}${getBlogArchivePath(post.resolvedLocale)}`,
          },
          { name: post.title, item: canonicalUrl },
        ]}
      />
      {faqItems.length ? <FaqJsonLd items={faqItems} /> : null}
      {mainImageUrl ? (
        <div className="relative h-100 w-full overflow-hidden bg-black lg:h-125">
          <Image
            src={mainImageUrl}
            alt={post.mainImage?.alt || post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 768px, 860px"
            fetchPriority="high"
            quality={60}
            className="object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="font-semibold text-gray-600 transition-colors md:hover:text-red-600"
            >
              {contentUi.homeLabel}
            </Link>
            <span className="text-gray-400">/</span>
            {post.categories?.[0] ? (
              <>
                <Link
                  href={`/categories/${post.categories[0].slug}`}
                  className="text-nowrap font-semibold text-gray-600 transition-colors md:hover:text-red-600"
                >
                  {post.categories[0].title}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            ) : null}
            <span className="truncate text-gray-400">{post.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
              {contentUi.languageLabel}
            </span>
            <div className="inline-flex overflow-hidden rounded-sm border border-gray-300 bg-white">
              {locale === "en" ? (
                <>
                  <span className="bg-gray-900 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white">
                    EN
                  </span>
                  {spanishVersionPath ? (
                    <Link
                      href={spanishVersionPath}
                      className="px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-gray-900 transition-colors md:hover:bg-gray-100"
                    >
                      ES
                    </Link>
                  ) : (
                    <span className="px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                      ES
                    </span>
                  )}
                </>
              ) : (
                <>
                  {englishVersionPath ? (
                    <Link
                      href={englishVersionPath}
                      className="px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-gray-900 transition-colors md:hover:bg-gray-100"
                    >
                      EN
                    </Link>
                  ) : (
                    <span className="px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                      EN
                    </span>
                  )}
                  <span className="bg-gray-900 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white">
                    ES
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-12 md:gap-10 lg:gap-12">
          <article className="md:col-span-8 lg:col-span-8" lang={post.resolvedLocale}>
            <div className="mb-4 flex flex-wrap gap-2">
              {(post.categories || []).slice(0, 3).map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="inline-flex self-start border border-[#f20d0d] bg-black px-3 py-1 shadow-[8px_8px_0px_0px_rgba(242,13,13,1)] -rotate-2"
                >
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#f20d0d]">
                    {category.title}
                  </span>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-4">
              {post.author?.name ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-sm font-bold text-gray-600">
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {post.author.name}
                    </p>
                    {post.publishedAt ? (
                      <time
                        dateTime={post.publishedAt}
                        className="text-xs text-gray-500"
                      >
                        {formatPublishedDate(post.publishedAt, post.resolvedLocale)}
                      </time>
                    ) : null}
                    {showUpdatedDate && effectiveUpdatedAt ? (
                      <p className="mt-0.5 text-xs font-semibold text-red-600">
                        {contentUi.updatedLabel}{" "}
                        <time dateTime={effectiveUpdatedAt}>
                          {formatPublishedDate(effectiveUpdatedAt, post.resolvedLocale)}
                        </time>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                <span
                  className="h-2 w-2 rounded-full bg-red-600"
                  aria-hidden="true"
                />
                {viewCount.toLocaleString()} {contentUi.viewsLabel}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-gray-500">
                  {contentUi.shareLabel}:
                </span>
                <button
                  type="button"
                  className="rounded-sm bg-gray-100 p-2 transition-colors md:hover:bg-gray-200"
                  aria-label={contentUi.facebookShareLabel}
                >
                  <svg
                    className="h-4 w-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded-sm bg-gray-100 p-2 transition-colors md:hover:bg-gray-200"
                  aria-label={contentUi.twitterShareLabel}
                >
                  <svg
                    className="h-4 w-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="blogContent prose prose-lg prose-neutral mt-8 max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-800 prose-p:leading-relaxed prose-a:rounded-sm prose-a:px-0.5 prose-a:font-semibold prose-a:text-red-600 prose-a:underline prose-a:decoration-2 prose-a:decoration-red-200 prose-a:underline-offset-4 prose-a:transition-colors prose-strong:font-bold prose-strong:text-gray-900 md:hover:prose-a:bg-red-50 md:hover:prose-a:text-red-700 md:hover:prose-a:decoration-red-500">
              {articleBodyContent}
            </div>

            {post.tags?.length ? (
              <section className="mt-12 border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-gray-900">
                  {contentUi.tagsHeading}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors md:hover:border-red-600 md:hover:bg-gray-50 md:hover:text-red-600"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {faqItems.length ? (
              <>
                <AdBlock
                  className="mt-12 mb-0"
                  instanceId={`${post._id}-before-faq`}
                />
                <section className="mt-12 rounded-sm border border-gray-200 bg-gray-50 p-6">
                  <h2 className="mb-6 text-2xl font-black text-gray-900">
                    {contentUi.faqHeading}
                  </h2>
                  <div className="space-y-4">
                    {faqItems.map((item, idx) => (
                      <details
                        key={`${item.question}-${idx}`}
                        className="group rounded-sm border border-gray-200 bg-white p-5"
                      >
                        <summary className="flex cursor-pointer items-start justify-between text-base font-bold text-gray-900">
                          <span className="pr-4">{item.question}</span>
                          <svg
                            className="h-5 w-5 shrink-0 text-red-600 transition-transform group-open:rotate-180"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </summary>
                        <p className="mt-4 leading-relaxed text-gray-700">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {nextBlog ? (
              <section className="mt-14">
                <div className="mt-5 overflow-hidden rounded-sm border border-anime-muted bg-black text-white shadow-[12px_12px_0px_0px_#f20d0d]">
                  <div className="grid gap-0 md:grid-cols-5">
                    <div className="relative h-52 md:col-span-2 md:h-full">
                      {nextBlog.mainImage?.asset?.url ? (
                        <Image
                          src={sanityImageUrl(nextBlog.mainImage, {
                            width: 1200,
                            quality: 70,
                          })}
                          alt={nextBlog.mainImage.alt || nextBlog.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 720px"
                          className="object-cover opacity-80"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center gap-2 rounded-sm bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                          {contentUi.nextInLabel(post.categories?.[0]?.title)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 p-6 md:col-span-3 md:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f20d0d]">
                        {contentUi.nextUpLabel}
                      </p>

                      <h2 className="line-clamp-3 text-2xl font-black leading-tight text-white md:text-3xl">
                        {nextBlog.title}
                      </h2>

                      {nextBlog.excerpt ? (
                        <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
                          {nextBlog.excerpt}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
                        {nextBlog.publishedAt ? (
                          <span>
                            {contentUi.filedLabel}{" "}
                            {formatPublishedDate(
                              nextBlog.publishedAt,
                              post.resolvedLocale,
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        <Link
                          href={getBlogPath(post.resolvedLocale, nextBlog.slug)}
                          className="group inline-flex items-center justify-between gap-3 rounded-sm border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white transition-colors md:hover:border-[#f20d0d] md:hover:bg-[#f20d0d]/10"
                        >
                          <span>{contentUi.readNextLabel}</span>
                          <span
                            aria-hidden="true"
                            className="text-[#f20d0d] transition-transform group-hover:translate-x-0.5"
                          >
                            {"->"}
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </article>

          <aside className="md:col-span-4 lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              {sidebarRelated.length ? (
                <section className="rounded-sm border border-gray-200 bg-white p-5">
                  <h3 className="mb-5 text-lg font-black uppercase tracking-tight text-gray-900">
                    {contentUi.sidebarHeading}
                  </h3>
                  <div className="space-y-4">
                    {sidebarRelated.map((relatedPost) => (
                      <Link
                        key={relatedPost._id || relatedPost.slug}
                        href={getBlogPath(post.resolvedLocale, relatedPost.slug)}
                        className="group block border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex gap-3">
                          {relatedPost.mainImage?.asset?.url ? (
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm bg-gray-200">
                              <Image
                                src={sanityImageUrl(relatedPost.mainImage, {
                                  width: 400,
                                  quality: 60,
                                })}
                                alt={relatedPost.mainImage.alt || relatedPost.title}
                                fill
                                sizes="(max-width: 768px) 40vw, 160px"
                                className="object-cover transition-transform duration-300 md:group-hover:scale-110"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <h4 className="line-clamp-3 text-sm font-bold leading-tight text-gray-900 transition-colors md:group-hover:text-red-600">
                              {relatedPost.title}
                            </h4>
                            {relatedPost.publishedAt ? (
                              <p className="mt-1 text-xs text-gray-500">
                                {formatPublishedDate(
                                  relatedPost.publishedAt,
                                  post.resolvedLocale,
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="rounded-sm border-2 border-red-600 bg-white p-6">
                <h3 className="text-lg font-black text-gray-900">
                  {contentUi.newsletterHeading}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {contentUi.newsletterCopy}
                </p>
                <form className="mt-4 space-y-3">
                  <input
                    type="email"
                    placeholder={contentUi.newsletterPlaceholder}
                    className="w-full rounded-sm border border-gray-300 px-4 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors md:hover:bg-red-700"
                  >
                    {contentUi.newsletterCta}
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
