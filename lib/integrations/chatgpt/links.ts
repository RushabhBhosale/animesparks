import { getBaseUrl } from "@/utils/seo";

import { InternalLinkValidationError } from "./errors";
import { isPublishedPost } from "./post-status";
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
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return null;
  }
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
      .filter((post) => isPublishedPost(post))
      .map((post) => post.slug.trim().toLowerCase()),
  );
  const invalid = new Set<string>();

  for (const link of input.internalLinks ?? []) {
    const slug = getInternalArticleSlug(link.url, baseUrl);
    if (!slug || !publishedSlugs.has(slug)) invalid.add(link.url);
  }

  for (const value of extractContentUrls(input.content)) {
    let url: URL;
    try {
      url = new URL(value, baseUrl);
    } catch {
      continue;
    }
    const siteHostname = normalizedHostname(new URL(baseUrl).hostname);
    if (normalizedHostname(url.hostname) !== siteHostname) continue;
    const slug = getInternalArticleSlug(value, baseUrl);
    if (!slug || !publishedSlugs.has(slug)) invalid.add(value);
  }

  if (invalid.size > 0) throw new InternalLinkValidationError([...invalid]);
}
