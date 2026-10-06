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
  return asset?.r2Key ? `${baseUrl.replace(/\/$/, "")}/${asset.r2Key}` : null;
}
