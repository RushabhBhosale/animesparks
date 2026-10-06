import "server-only";
import { client as sanityClient } from "@/sanity/lib/client";
import { getContentSource } from "./provider";
import { mongoFetch, mongoFetchRelated } from "./mongodb";

export const client = {
  withConfig(_config: Record<string, unknown>) { return client; },
  fetch<T>(query: string, params: Record<string, unknown> = {}, options?: unknown): Promise<T> {
    if (getContentSource() === "mongodb") return mongoFetch<T>(query, params);
    return sanityClient.fetch<T>(query, params, options as never);
  },
};

export async function fetchArticleRelated<T>(args: {
  locale: "en" | "es";
  animeName?: string;
  currentId: string;
  categoryIds: string[];
  tags: string[];
  franchiseQuery: string;
  topicalQuery: string;
}): Promise<{ franchise: T[]; related: T[] }> {
  if (getContentSource() === "mongodb") {
    return mongoFetchRelated<T>(args);
  }
  const [franchise, related] = await Promise.all([
    args.animeName
      ? sanityClient.fetch<T[]>(args.franchiseQuery, { animeName: args.animeName, currentId: args.currentId })
      : Promise.resolve([]),
    args.categoryIds.length || args.tags.length
      ? sanityClient.fetch<T[]>(args.topicalQuery, { currentId: args.currentId, categoryIds: args.categoryIds, tags: args.tags })
      : Promise.resolve([]),
  ]);
  return { franchise, related };
}
