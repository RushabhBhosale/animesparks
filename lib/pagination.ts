import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const BLOG_PAGE_SIZE = 12;
export type ListingSearchParams = Record<string, string | string[] | undefined>;
export type PaginationInfo = { page: number; pageCount: number; total: number; start: number; end: number };

export function parsePage(value?: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^[1-9]\d*$/.test(raw)) return 1;
  const page = Number(raw);
  if (!Number.isSafeInteger(page)) notFound();
  return page;
}

export function paginate<T>(items: T[], value?: string | string[], pageSize = BLOG_PAGE_SIZE) {
  const page = parsePage(value);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount) notFound();
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    pagination: { page, pageCount, total, start: total ? offset + 1 : 0, end: Math.min(offset + pageSize, total) },
  };
}

export function listingHref(path: string, query: ListingSearchParams = {}, page = 1, pageKey = "page") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first && key !== pageKey) params.set(key, first);
  }
  if (page > 1) params.set(pageKey, String(page));
  return `${path}${params.size ? `?${params}` : ""}`;
}

export function withListingMetadata(metadata: Metadata, path: string, query: ListingSearchParams): Metadata {
  const page = parsePage(query.page);
  const filters: ListingSearchParams = {};
  for (const key of ["q", "sort", "range", "esPage"]) {
    if (query[key]) filters[key] = query[key];
  }
  const url = listingHref(path, filters, page);
  const title = typeof metadata.title === "string" && page > 1 ? `${metadata.title} · Page ${page}` : metadata.title;
  return {
    ...metadata,
    title,
    alternates: { ...metadata.alternates, canonical: url },
    openGraph: { ...metadata.openGraph, url, ...(typeof title === "string" ? { title } : {}) },
    twitter: { ...metadata.twitter, ...(typeof title === "string" ? { title } : {}) },
  };
}
