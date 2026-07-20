import { getBaseUrl } from "@/utils/seo";

import { InternalLinkValidationError } from "./errors";
import type { CreateBlogDraftRequest } from "./schemas";
import type { StoredPost } from "./types";

function normalizedHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function getInternalArticleSlug(value: string, baseUrl = getBaseUrl()): string | null {
  let url: URL;
  try {
    url = new URL(value, baseUrl);
  } catch {
    return null;
  }
  const site = new URL(baseUrl);
  if (normalizedHostname(url.hostname) !== normalizedHostname(site.hostname)) return null;
  const match = url.pathname.match(/^\/blog\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]).toLowerCase() : null;
}

export function extractContentUrls(content: string): string[] {
  const urls = new Set<string>();
  const markdownPattern = /\[[^\]]+\]\(([^)\s]+)\)/g;
  const htmlPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const pattern of [markdownPattern, htmlPattern]) {
    for (const match of content.matchAll(pattern)) if (match[1]) urls.add(match[1]);
  }
  return [...urls];
}

export function validateInternalLinks(
  input: Pick<CreateBlogDraftRequest, "content" | "internalLinks">,
  posts: StoredPost[],
  baseUrl = getBaseUrl(),
): void {
  const publishedSlugs = new Set(
    posts
      .filter((post) => !post._id.startsWith("drafts.") && post.publishedAt)
      .map((post) => post.slug.toLowerCase()),
  );
  const siteHostname = normalizedHostname(new URL(baseUrl).hostname);
  const invalid = new Set<string>();

  for (const link of input.internalLinks ?? []) {
    const url = new URL(link.url);
    const slug = getInternalArticleSlug(link.url, baseUrl);
    if (normalizedHostname(url.hostname) !== siteHostname || !slug || !publishedSlugs.has(slug)) invalid.add(link.url);
  }

  for (const value of extractContentUrls(input.content)) {
    let url: URL;
    try {
      url = new URL(value, baseUrl);
    } catch {
      continue;
    }
    if (normalizedHostname(url.hostname) !== siteHostname) continue;
    const slug = getInternalArticleSlug(value, baseUrl);
    if (!slug || !publishedSlugs.has(slug)) invalid.add(value);
  }

  if (invalid.size > 0) throw new InternalLinkValidationError([...invalid]);
}
