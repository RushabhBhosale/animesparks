export const CHATGPT_ARTICLE_TYPES = [
  "release-date",
  "news",
  "explained",
  "characters",
  "recommendation",
  "review",
  "other",
] as const;

export type ChatGptArticleType = (typeof CHATGPT_ARTICLE_TYPES)[number];
export type PostStatus = "draft" | "published";

export interface SanityReference {
  _type: "reference";
  _ref: string;
}

export interface EditorialReferences {
  author?: SanityReference;
  category?: SanityReference;
}

export interface ContentContextPost {
  id: string;
  title: string;
  slug: string;
  url: string;
  animeName?: string;
  articleType?: string;
  excerpt?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  status: PostStatus;
  publishedAt?: string;
}

export interface InternalLinkInput {
  text: string;
  url: string;
}

export interface StoredInternalLink extends InternalLinkInput {
  _key?: string;
  _type?: "internalLink";
}

export interface StoredArticleSource {
  name: string;
  url: string;
  _key?: string;
  _type?: "articleSource";
}

export interface StoredFaqItem {
  question: string;
  answer: string;
  _key?: string;
  _type?: "faqItem";
}

export interface EditableBlogPost extends ContentContextPost {
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  internalLinks?: InternalLinkInput[];
  sources?: Array<Pick<StoredArticleSource, "name" | "url">>;
  faq?: Array<Pick<StoredFaqItem, "question" | "answer">>;
}

export interface StoredPost {
  _id: string;
  _type: "post";
  title: string;
  slug: string;
  excerpt?: string;
  animeName?: string;
  articleType?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  publishedAt?: string;
  body?: PortableTextValue;
  internalLinks?: StoredInternalLink[];
  sources?: StoredArticleSource[];
  faq?: StoredFaqItem[];
  [key: string]: unknown;
}

export interface SanityPostDocument {
  _id: string;
  _type: "post";
  title: string;
  slug: { _type: "slug"; current: string };
  body?: PortableTextValue;
  [key: string]: unknown;
}

export interface PortableTextSpan {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
}

export interface PortableTextMarkDef {
  _key: string;
  _type: "link";
  href: string;
}

export interface PortableTextBlock {
  _key: string;
  _type: "block";
  style: "normal" | "h2" | "h3" | "h4" | "blockquote";
  children: PortableTextSpan[];
  markDefs: PortableTextMarkDef[];
  listItem?: "bullet" | "number";
  level?: number;
}

export interface PortableTextImage {
  _key: string;
  _type: "image";
  asset: { _type: "reference"; _ref: string };
  alt: string;
  sourceUrl: string;
  sourcePage?: string;
  hostedUrl: string;
  imagePurpose: "hero" | "article";
  insertAfterHeading?: string;
}

export type PortableTextValue = Array<PortableTextBlock | PortableTextImage>;

export interface ImageSubmission {
  sourceUrl: string;
  sourcePage?: string;
  alt: string;
  insertAfterHeading?: string;
}

export interface ImportedImage {
  image: PortableTextImage;
  warnings: string[];
}

export interface ImageImporter {
  importImage(args: {
    image: ImageSubmission;
    purpose: "hero" | "article";
    slug: string;
    index: number;
  }): Promise<ImportedImage>;
}

export interface ChatGptBlogRepository {
  listPosts(): Promise<StoredPost[]>;
  getEditorialReferences(articleType: ChatGptArticleType, categorySlug?: string): Promise<EditorialReferences>;
  createDraft(document: SanityPostDocument): Promise<StoredPost>;
  createOrReplaceDraft(document: SanityPostDocument): Promise<StoredPost>;
  getDraft(id: string): Promise<StoredPost | null>;
  getPublished(id: string): Promise<StoredPost | null>;
  publishDraft(id: string, publishedAt: string): Promise<StoredPost>;
}
