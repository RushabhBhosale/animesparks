import type { StoredPost } from "./types";

export function isDraftPost(post: StoredPost): boolean {
  return post._id.startsWith("drafts.");
}

/**
 * Keep the integration's definition of "published" identical to the public
 * blog queries: a canonical document with a publishedAt in the past.
 */
export function isPublishedPost(post: StoredPost, now = new Date()): boolean {
  if (isDraftPost(post) || !post.publishedAt) return false;
  const publishedAt = Date.parse(post.publishedAt);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

export function postStatus(post: StoredPost): "draft" | "published" {
  return isDraftPost(post) ? "draft" : "published";
}
