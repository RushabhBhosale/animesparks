export type PublicArticle = {
  publicationState?: string;
  slug?: string | null;
  publishedAt?: string | Date | null;
  [key: string]: unknown;
};

export function selectPublishedArticles<T extends PublicArticle>(
  documents: T[], options: { now?: Date; categoryId?: string; tag?: string; limit?: number } = {},
): T[] {
  const now = options.now ?? new Date();
  return documents.filter((doc) => {
    if (doc.publicationState !== "published" || !doc.slug) return false;
    const time = new Date(doc.publishedAt ?? "").getTime();
    if (!Number.isFinite(time) || time > now.getTime()) return false;
    if (options.categoryId && !(doc.categorySanityIds as string[] | undefined)?.includes(options.categoryId)) return false;
    if (options.tag && !(doc.tags as string[] | undefined)?.includes(options.tag)) return false;
    return true;
  }).sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
    .slice(0, options.limit);
}

export function resolveSpanishFallback<T extends Record<string, any>>(overrides: T, original: Record<string, any> | null, fields: string[]): T {
  const resolved: Record<string, any> = { ...overrides };
  if (!original) return resolved as T;
  for (const field of fields) if (resolved[field] == null) resolved[field] = original[field];
  return resolved as T;
}

export function resolveR2AssetUrl(asset: { r2Key?: string } | null | undefined, baseUrl: string): string | null {
  if (!asset?.r2Key) return null;
  const key = asset.r2Key.replace(/^\/+/, "");
  if (!key || key.split("/").some((part) => !part || part === "." || part === "..")) return null;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/+$/, "")}/${encodedKey}`;
}

export function resolveMongoImageUrl(
  image: { asset?: { r2Key?: string; url?: string; publicUrl?: string } } | null | undefined,
  baseUrl: string,
): string | null {
  const asset = image?.asset;
  if (!asset) return null;

  const mappedUrl = resolveR2AssetUrl(asset, baseUrl);
  if (mappedUrl) return mappedUrl;

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  for (const candidate of [asset.url, asset.publicUrl]) {
    if (candidate?.startsWith(`${normalizedBase}/`)) return candidate;
  }

  // A Mongo-backed page must never send an unmapped Sanity reference to the
  // Sanity image builder. Missing R2 mappings render without the image.
  return null;
}
