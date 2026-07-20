import type { CreateBlogDraftRequest } from "./schemas";
import type { StoredPost } from "./types";

const STOP_WORDS = new Set(["a", "an", "and", "for", "from", "in", "is", "of", "on", "the", "to", "with"]);

export function normalizeContentValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function significantTokens(value: string): Set<string> {
  return new Set(normalizeContentValue(value).split(" ").filter((token) => token && !STOP_WORDS.has(token)));
}

function levenshteinDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[right.length];
}

export function titleSimilarity(left: string, right: string): number {
  const a = normalizeContentValue(left);
  const b = normalizeContentValue(right);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - levenshteinDistance(a, b) / maxLength;
}

export function tokenOverlap(left: string, right: string): number {
  const a = significantTokens(left);
  const b = significantTokens(right);
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / union.size;
}

export function slugify(value: string): string {
  const slug = normalizeContentValue(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/g, "");
  return slug || "anime-article";
}

export function createUniqueSlug(preferredSlug: string | undefined, title: string, posts: StoredPost[]): string {
  const base = preferredSlug || slugify(title);
  const used = new Set(posts.map((post) => post.slug));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const candidate = `${base.slice(0, Math.max(1, 96 - String(suffix).length))}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base.slice(0, 78)}-${Date.now()}`;
}

export function findDuplicatePost(input: CreateBlogDraftRequest, requestedSlug: string, posts: StoredPost[]): StoredPost | undefined {
  const normalizedTitle = normalizeContentValue(input.title);
  const normalizedAnime = normalizeContentValue(input.animeName);
  const normalizedKeyword = normalizeContentValue(input.primaryKeyword ?? "");

  return posts
    .filter((post) => {
      const postTitle = normalizeContentValue(post.title);
      const sameTitle = postTitle === normalizedTitle;
      const sameSlug = post.slug === requestedSlug;
      const sameKeyword = normalizedKeyword && normalizeContentValue(post.primaryKeyword ?? "") === normalizedKeyword;
      const sameAnime = normalizeContentValue(post.animeName ?? "") === normalizedAnime;
      const sameType = post.articleType === input.articleType;
      const similarity = titleSimilarity(post.title, input.title);
      const overlap = tokenOverlap(post.title, input.title);
      return Boolean(
        sameTitle ||
          sameSlug ||
          sameKeyword ||
          similarity >= 0.86 ||
          (sameAnime && sameType && (similarity >= 0.7 || overlap >= 0.68)),
      );
    })
    .sort((left, right) => Number(Boolean(right.publishedAt)) - Number(Boolean(left.publishedAt)))[0];
}
