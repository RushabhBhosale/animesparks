import { z } from "zod";

import { CHATGPT_ARTICLE_TYPES } from "./types";

const text = (field: string, max: number) =>
  z.string().trim().min(1, `${field} is required`).max(max, `${field} is too long`);

const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2_048)
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "Only HTTP and HTTPS URLs are allowed",
  });

const imageSchema = z
  .object({
    sourceUrl: httpUrl,
    sourcePage: httpUrl.optional(),
    alt: text("image alt text", 300),
  })
  .strict();

export const createBlogDraftSchema = z
  .object({
    title: text("title", 140),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must contain lowercase letters, numbers, and hyphens only")
      .optional(),
    animeName: text("animeName", 120),
    articleType: z.enum(CHATGPT_ARTICLE_TYPES),
    excerpt: text("excerpt", 500),
    content: z
      .string()
      .trim()
      .min(500, "content must be a complete article of at least 500 characters")
      .max(120_000, "content is too long"),
    metaTitle: z.string().trim().min(1).max(70).optional(),
    metaDescription: z.string().trim().min(1).max(180).optional(),
    primaryKeyword: z.string().trim().min(1).max(160).optional(),
    secondaryKeywords: z.array(text("secondary keyword", 160)).max(20).optional(),
    heroImage: imageSchema.optional(),
    contentImages: z
      .array(imageSchema.extend({ insertAfterHeading: z.string().trim().min(1).max(240).optional() }).strict())
      .max(2)
      .optional(),
    internalLinks: z
      .array(z.object({ text: text("link text", 240), url: httpUrl }).strict())
      .max(10)
      .optional(),
    sources: z
      .array(z.object({ name: text("source name", 240), url: httpUrl }).strict())
      .max(30)
      .optional(),
  })
  .strict();

export const contentContextQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  animeName: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "published"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const publishBlogDraftSchema = z
  .object({ publishKey: text("publishKey", 512) })
  .strict();

export type CreateBlogDraftRequest = z.infer<typeof createBlogDraftSchema>;
export type ContentContextQuery = z.infer<typeof contentContextQuerySchema>;
