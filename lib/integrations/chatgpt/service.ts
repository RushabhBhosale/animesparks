import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import { getBaseUrl } from "@/utils/seo";

import {
  AmbiguousBlogPostError,
  AlreadyPublishedError,
  DraftNotFoundError,
  IntegrationConfigurationError,
  PublishedPostNotFoundError,
} from "./errors";
import { validateInternalLinks } from "./links";
import {
  addInternalLinksToPortableText,
  insertContentImages,
  markdownToPortableText,
  portableTextToMarkdown,
} from "./portable-text";
import { isDraftPost, isPublishedPost, postStatus } from "./post-status";
import type {
  ContentContextQuery,
  CreateBlogDraftRequest,
  UpdateBlogPostByNameRequest,
  UpdateBlogPostRequest,
} from "./schemas";
import { createUniqueSlug, findDuplicatePost, normalizeContentValue, slugify } from "./rules";
import type {
  ChatGptBlogRepository,
  ChatGptArticleType,
  ContentContextPost,
  EditableBlogPost,
  ImageImporter,
  InternalLinkInput,
  PortableTextImage,
  SanityPostDocument,
  StoredPost,
} from "./types";
import { CHATGPT_ARTICLE_TYPES } from "./types";

const canonicalId = (id: string) => id.replace(/^drafts\./, "");

function siteUrl(slug: string, baseUrl = getBaseUrl()): string {
  return `${baseUrl}/blog/${slug}`;
}

function editorUrl(id: string, baseUrl = getBaseUrl()): string {
  return `${baseUrl}/studio/intent/edit/id=${encodeURIComponent(id)};type=post`;
}

function toContextPost(post: StoredPost, baseUrl: string): ContentContextPost {
  return {
    id: canonicalId(post._id),
    title: post.title,
    slug: post.slug,
    url: siteUrl(post.slug, baseUrl),
    ...(post.animeName ? { animeName: post.animeName } : {}),
    ...(post.articleType ? { articleType: post.articleType } : {}),
    ...(post.excerpt ? { excerpt: post.excerpt } : {}),
    ...(post.primaryKeyword ? { primaryKeyword: post.primaryKeyword } : {}),
    ...(post.secondaryKeywords?.length ? { secondaryKeywords: post.secondaryKeywords } : {}),
    status: postStatus(post),
    ...(isPublishedPost(post) ? { publishedAt: post.publishedAt } : {}),
  };
}

function storedInternalLinks(post: StoredPost): InternalLinkInput[] {
  return (post.internalLinks ?? [])
    .filter((link) => typeof link.text === "string" && typeof link.url === "string")
    .map(({ text, url }) => ({ text, url }));
}

function toEditablePost(post: StoredPost, baseUrl: string): EditableBlogPost {
  return {
    ...toContextPost(post, baseUrl),
    content: portableTextToMarkdown(post.body ?? []),
    ...(post.metaTitle ? { metaTitle: post.metaTitle } : {}),
    ...(post.metaDescription ? { metaDescription: post.metaDescription } : {}),
    ...(post.tags?.length ? { tags: post.tags } : {}),
    ...(storedInternalLinks(post).length ? { internalLinks: storedInternalLinks(post) } : {}),
    ...(post.sources?.length
      ? { sources: post.sources.map(({ name, url }) => ({ name, url })) }
      : {}),
    ...(post.faq?.length
      ? { faq: post.faq.map(({ question, answer }) => ({ question, answer })) }
      : {}),
  };
}

export async function getContentContext(
  repository: ChatGptBlogRepository,
  query: ContentContextQuery,
  baseUrl = getBaseUrl(),
): Promise<{ posts: ContentContextPost[]; published: ContentContextPost[]; drafts: ContentContextPost[] }> {
  const records = await repository.listPosts();
  const now = new Date();
  const byCanonicalId = new Map<string, StoredPost>();
  for (const record of records) {
    const id = canonicalId(record._id);
    const current = byCanonicalId.get(id);
    if (!current || (isDraftPost(current) && !isDraftPost(record))) byCanonicalId.set(id, record);
  }
  const search = normalizeContentValue(query.search ?? "");
  const anime = normalizeContentValue(query.animeName ?? "");
  const candidates = [...byCanonicalId.values()]
    .filter((post) => isDraftPost(post) || isPublishedPost(post, now))
    .filter((post) => {
      if (!query.status) return true;
      return query.status === "draft" ? isDraftPost(post) : isPublishedPost(post, now);
    })
    // Older AnimeSparks posts do not consistently have animeName populated.
    // Fall back to title/slug so an animeName filter remains useful.
    .filter((post) => {
      if (!anime) return true;
      return normalizeContentValue([post.animeName, post.title, post.slug].filter(Boolean).join(" ")).includes(anime);
    });

  const scored = candidates
    .map((post, index) => ({ post, index, score: contextSearchScore(post, search) }))
    .filter(({ score }) => !search || score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, query.limit);
  const posts = scored.map(({ post }) => toContextPost(post, baseUrl));
  return {
    posts,
    // Keep `posts` for compatibility while exposing unambiguous buckets for
    // callers choosing public internal links.
    published: posts.filter((post) => post.status === "published"),
    drafts: posts.filter((post) => post.status === "draft"),
  };
}

const CONTEXT_STOP_WORDS = new Set(["a", "an", "and", "for", "from", "in", "is", "of", "on", "the", "to", "with"]);

function contextSearchScore(post: StoredPost, search: string): number {
  if (!search) return 0;
  const searchable = normalizeContentValue(
    [
      post.title,
      post.slug,
      post.animeName,
      post.excerpt,
      post.primaryKeyword,
      ...(post.secondaryKeywords ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
  if (searchable.includes(search)) return 2;
  const tokens = search.split(" ").filter((token) => token.length > 1 && !CONTEXT_STOP_WORDS.has(token));
  if (!tokens.length) return 0;
  const matches = tokens.filter((token) => searchable.includes(token)).length;
  return matches / tokens.length;
}

export type CreateDraftResult =
  | {
      success: false;
      duplicate: true;
      message: string;
      existingPost: Pick<ContentContextPost, "id" | "title" | "slug" | "url" | "status">;
    }
  | {
      success: true;
      draft: { id: string; title: string; slug: string; status: "draft"; previewUrl: string };
      imageWarnings?: string[];
    };

async function importImages(
  input: CreateBlogDraftRequest,
  slug: string,
  importer: ImageImporter,
): Promise<{ hero?: PortableTextImage; content: PortableTextImage[]; warnings: string[] }> {
  const warnings: string[] = [];
  const seen = new Set<string>();
  let hero: PortableTextImage | undefined;

  if (input.heroImage) {
    seen.add(input.heroImage.sourceUrl);
    try {
      const imported = await importer.importImage({ image: input.heroImage, purpose: "hero", slug, index: 0 });
      hero = imported.image;
      warnings.push(...imported.warnings);
    } catch (error) {
      console.warn(
        "[chatgpt-integration] hero image import failed",
        JSON.stringify({ sourceUrl: input.heroImage.sourceUrl, message: error instanceof Error ? error.message : String(error) }),
      );
      warnings.push("Hero image could not be downloaded or uploaded.");
    }
  }

  const content: PortableTextImage[] = [];
  for (const [index, image] of (input.contentImages ?? []).entries()) {
    if (seen.has(image.sourceUrl)) {
      warnings.push(`Content image ${index + 1} duplicates another submitted image and was skipped.`);
      continue;
    }
    seen.add(image.sourceUrl);
    try {
      const imported = await importer.importImage({ image, purpose: "article", slug, index });
      content.push(imported.image);
      warnings.push(...imported.warnings.map((warning) => `Content image ${index + 1}: ${warning}`));
    } catch (error) {
      console.warn(
        "[chatgpt-integration] content image import failed",
        JSON.stringify({ index: index + 1, sourceUrl: image.sourceUrl, message: error instanceof Error ? error.message : String(error) }),
      );
      warnings.push(`Content image ${index + 1} could not be downloaded or uploaded.`);
    }
  }
  return { hero, content, warnings };
}

function asMainImage(image: PortableTextImage | undefined): Record<string, unknown> | undefined {
  if (!image) return undefined;
  const { _key: _discardedKey, insertAfterHeading: _discardedPlacement, ...mainImage } = image;
  void _discardedKey;
  void _discardedPlacement;
  return mainImage;
}

export async function createBlogDraft(args: {
  input: CreateBlogDraftRequest;
  repository: ChatGptBlogRepository;
  imageImporter: ImageImporter;
  baseUrl?: string;
}): Promise<CreateDraftResult> {
  const baseUrl = args.baseUrl ?? getBaseUrl();
  const posts = await args.repository.listPosts();
  const requestedSlug = args.input.slug ?? slugify(args.input.title);
  const duplicate = findDuplicatePost(args.input, requestedSlug, posts);
  if (duplicate) {
    const context = toContextPost(duplicate, baseUrl);
    return {
      success: false,
      duplicate: true,
      message: "A similar article already exists.",
      existingPost: {
        id: context.id,
        title: context.title,
        slug: context.slug,
        url: context.url,
        status: context.status,
      },
    };
  }

  validateInternalLinks(args.input, posts, baseUrl);
  const editorialReferences = await args.repository.getEditorialReferences(args.input.articleType, args.input.categorySlug);
  const slug = createUniqueSlug(args.input.slug, args.input.title, posts);
  const imported = await importImages(args.input, slug, args.imageImporter);
  const portableText = markdownToPortableText(args.input.content, args.input.internalLinks);
  const placed = insertContentImages(portableText, imported.content);
  const id = randomUUID();
  const now = new Date().toISOString();
  const document: SanityPostDocument = {
    _id: `drafts.${id}`,
    _type: "post",
    title: args.input.title,
    slug: { _type: "slug", current: slug },
    excerpt: args.input.excerpt,
    animeName: args.input.animeName,
    articleType: args.input.articleType,
    ...(editorialReferences.author ? { author: editorialReferences.author } : {}),
    ...(editorialReferences.category ? { categories: [editorialReferences.category] } : {}),
    body: placed.body,
    ...(args.input.metaTitle ? { metaTitle: args.input.metaTitle } : {}),
    metaDescription: args.input.metaDescription ?? args.input.excerpt.slice(0, 180),
    ...(args.input.primaryKeyword ? { primaryKeyword: args.input.primaryKeyword } : {}),
    ...(args.input.secondaryKeywords?.length ? { secondaryKeywords: args.input.secondaryKeywords } : {}),
    ...(args.input.internalLinks?.length
      ? {
          internalLinks: args.input.internalLinks.map((link) => ({
            _key: randomUUID().slice(0, 12),
            _type: "internalLink",
            ...link,
          })),
        }
      : {}),
    ...(args.input.sources?.length
      ? {
          sources: args.input.sources.map((source) => ({
            _key: randomUUID().slice(0, 12),
            _type: "articleSource",
            ...source,
          })),
        }
      : {}),
    ...(args.input.faq?.length
      ? {
          faq: args.input.faq.map((item) => ({
            _key: randomUUID().slice(0, 12),
            _type: "faqItem",
            ...item,
          })),
        }
      : {}),
    ...(imported.hero ? { mainImage: asMainImage(imported.hero) } : {}),
    integrationCreatedAt: now,
  };
  const created = await args.repository.createDraft(document);
  const imageWarnings = [...imported.warnings, ...placed.warnings];
  return {
    success: true,
    draft: {
      id: canonicalId(created._id),
      title: created.title,
      slug: created.slug,
      status: "draft",
      previewUrl: editorUrl(canonicalId(created._id), baseUrl),
    },
    ...(imageWarnings.length ? { imageWarnings } : {}),
  };
}

export async function getBlogPost(args: {
  id: string;
  repository: ChatGptBlogRepository;
  baseUrl?: string;
}): Promise<{ success: true; post: EditableBlogPost }> {
  const post = await args.repository.getPublished(canonicalId(args.id));
  if (!post || !isPublishedPost(post)) throw new PublishedPostNotFoundError();
  return { success: true, post: toEditablePost(post, args.baseUrl ?? getBaseUrl()) };
}

function blogMatchScore(post: StoredPost, identifier: string): number {
  const query = normalizeContentValue(identifier);
  const title = normalizeContentValue(post.title);
  const slug = normalizeContentValue(post.slug);
  if (title === query || slug === query) return 3;
  if (title.includes(query) || query.includes(title) || slug.includes(query) || query.includes(slug)) return 2;
  const queryTokens = query.split(" ").filter(Boolean);
  if (!queryTokens.length) return 0;
  const searchable = `${title} ${slug}`;
  const matchedTokens = queryTokens.filter((token) => searchable.includes(token)).length;
  return matchedTokens === queryTokens.length ? 1 : 0;
}

export async function resolvePublishedBlogId(args: {
  blogName: string;
  repository: ChatGptBlogRepository;
}): Promise<string> {
  const records = await args.repository.listPosts();
  const matches = records
    .filter((post) => isPublishedPost(post))
    .map((post) => ({ post, score: blogMatchScore(post, args.blogName) }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        Date.parse(right.post.publishedAt ?? "") - Date.parse(left.post.publishedAt ?? ""),
    );
  const bestScore = matches[0]?.score;
  const best = matches.filter((match) => match.score === bestScore);
  if (bestScore !== 3 && best.length > 0) return canonicalId(best[0].post._id);
  if (best.length === 1) return canonicalId(best[0].post._id);
  if (best.length > 1) {
    throw new AmbiguousBlogPostError(
      best.map(({ post }) => ({ id: canonicalId(post._id), title: post.title, slug: post.slug })),
    );
  }
  throw new PublishedPostNotFoundError();
}

export type UpdateBlogPostResult = {
  success: true;
  draft: {
    id: string;
    title: string;
    slug: string;
    status: "draft";
    previewUrl: string;
  };
  changedFields: string[];
  warnings?: string[];
};

function hasUpdateField(input: UpdateBlogPostRequest, field: keyof UpdateBlogPostRequest): boolean {
  return Object.prototype.hasOwnProperty.call(input, field);
}

function articleTypeFor(value: string | undefined): ChatGptArticleType {
  return CHATGPT_ARTICLE_TYPES.includes(value as ChatGptArticleType) ? (value as ChatGptArticleType) : "other";
}

function keyedRecords<T extends Record<string, unknown>>(type: string, values: T[]): Array<T & { _key: string; _type: string }> {
  return values.map((value) => ({ _key: randomUUID().slice(0, 12), _type: type, ...value }));
}

export async function updateBlogPost(args: {
  id: string;
  input: UpdateBlogPostRequest;
  repository: ChatGptBlogRepository;
  baseUrl?: string;
}): Promise<UpdateBlogPostResult> {
  const baseUrl = args.baseUrl ?? getBaseUrl();
  const id = canonicalId(args.id);
  const current = await args.repository.getPublished(id);
  if (!current || !isPublishedPost(current)) throw new PublishedPostNotFoundError();

  const posts = await args.repository.listPosts();
  validateInternalLinks(
    { content: args.input.content ?? "", internalLinks: args.input.internalLinks },
    posts,
    baseUrl,
  );

  const preservedBody = current.body ?? [];
  const linksForContent = args.input.internalLinks ?? storedInternalLinks(current);
  let body = preservedBody;
  const warnings: string[] = [];

  if (hasUpdateField(args.input, "content") && args.input.content) {
    const parsedBody = markdownToPortableText(args.input.content, linksForContent);
    const existingImages = preservedBody.filter((item): item is PortableTextImage => item._type === "image");
    const placed = insertContentImages(parsedBody, existingImages);
    body = placed.body;
    warnings.push(...placed.warnings);
  } else if (hasUpdateField(args.input, "internalLinks")) {
    const linked = addInternalLinksToPortableText(preservedBody, args.input.internalLinks ?? []);
    body = linked.body;
    warnings.push(...linked.warnings);
  }

  const {
    _id: _currentId,
    _type: _currentType,
    _rev: _revision,
    _createdAt: _created,
    _updatedAt: _updated,
    slug: _currentSlug,
    body: _currentBody,
    ...preservedFields
  } = current;
  void _currentId;
  void _currentType;
  void _revision;
  void _created;
  void _updated;
  void _currentSlug;
  void _currentBody;

  const document: SanityPostDocument = {
    ...preservedFields,
    _id: `drafts.${id}`,
    _type: "post",
    title: args.input.title ?? current.title,
    slug: { _type: "slug", current: args.input.slug ?? current.slug },
    body,
    ...(hasUpdateField(args.input, "excerpt") ? { excerpt: args.input.excerpt } : {}),
    ...(hasUpdateField(args.input, "animeName") ? { animeName: args.input.animeName } : {}),
    ...(hasUpdateField(args.input, "articleType") ? { articleType: args.input.articleType } : {}),
    ...(hasUpdateField(args.input, "metaTitle") ? { metaTitle: args.input.metaTitle } : {}),
    ...(hasUpdateField(args.input, "metaDescription") ? { metaDescription: args.input.metaDescription } : {}),
    ...(hasUpdateField(args.input, "primaryKeyword") ? { primaryKeyword: args.input.primaryKeyword } : {}),
    ...(hasUpdateField(args.input, "secondaryKeywords") ? { secondaryKeywords: args.input.secondaryKeywords } : {}),
    ...(hasUpdateField(args.input, "tags") ? { tags: args.input.tags } : {}),
    ...(hasUpdateField(args.input, "internalLinks")
      ? { internalLinks: keyedRecords("internalLink", args.input.internalLinks ?? []) }
      : {}),
    ...(hasUpdateField(args.input, "sources")
      ? { sources: keyedRecords("articleSource", args.input.sources ?? []) }
      : {}),
    ...(hasUpdateField(args.input, "faq") ? { faq: keyedRecords("faqItem", args.input.faq ?? []) } : {}),
  };

  if (hasUpdateField(args.input, "categorySlug")) {
    const references = await args.repository.getEditorialReferences(
      articleTypeFor(args.input.articleType ?? current.articleType),
      args.input.categorySlug,
    );
    if (references.category) document.categories = [references.category];
  }

  const saved = await args.repository.createOrReplaceDraft(document);
  return {
    success: true,
    draft: {
      id,
      title: saved.title,
      slug: saved.slug,
      status: "draft",
      previewUrl: editorUrl(id, baseUrl),
    },
    changedFields: Object.keys(args.input),
    ...(warnings.length ? { warnings } : {}),
  };
}

export async function updateBlogPostByName(args: {
  blogName: string;
  input: UpdateBlogPostByNameRequest;
  repository: ChatGptBlogRepository;
  baseUrl?: string;
}): Promise<UpdateBlogPostResult> {
  const id = await resolvePublishedBlogId({ blogName: args.blogName, repository: args.repository });
  const { blogName: _blogName, ...input } = args.input;
  void _blogName;
  return updateBlogPost({ id, input, repository: args.repository, baseUrl: args.baseUrl });
}

export function isValidPublishKey(provided: string, expected = process.env.BLOG_PUBLISH_KEY): boolean {
  if (!expected?.trim()) throw new IntegrationConfigurationError("BLOG_PUBLISH_KEY is not configured.");
  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

export async function publishBlogDraft(args: {
  id: string;
  repository: ChatGptBlogRepository;
  baseUrl?: string;
  now?: () => Date;
}): Promise<{ success: true; post: { id: string; title: string; status: "published"; url: string } }> {
  const id = canonicalId(args.id);
  const draft = await args.repository.getDraft(id);
  if (!draft) {
    const published = await args.repository.getPublished(id);
    if (published) {
      throw new AlreadyPublishedError({
        id,
        title: published.title,
        slug: published.slug,
        publishedAt: published.publishedAt,
      });
    }
    throw new DraftNotFoundError();
  }
  const publishedAt = (args.now ?? (() => new Date()))().toISOString();
  const published = await args.repository.publishDraft(id, publishedAt);
  return {
    success: true,
    post: {
      id,
      title: published.title,
      status: "published",
      url: siteUrl(published.slug, args.baseUrl ?? getBaseUrl()),
    },
  };
}
