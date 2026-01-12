import Fuse from "fuse.js";

export type SearchDoc = {
  id: string;
  title: string;
  metaDescription?: string;
  slug: string;
  typeLabel?: string;
};

export type RankedSearchResult = {
  id: string;
  title: string;
  slug: string;
  typeLabel?: string;
  metaDescription?: string;
  publishedAt?: string;
  score: number;
};

const synonymMap: Record<string, string> = {
  kdrama: "kdrama",
  kdramas: "kdrama",
  kdramac: "kdrama",
  kdramaa: "kdrama",
  "k-drama": "kdrama",
  "k-dramas": "kdrama",
  "k drama": "kdrama",
  jjk: "jujutsukaisen",
  aot: "attackontitan",
  op: "onepiece",
};

export const canonicalizeSearchValue = (value: string) =>
  (synonymMap[value] || value).toLowerCase().replace(/[^a-z0-9]/g, "");

const buildNormalizedFields = (doc: SearchDoc) => {
  const fields = [doc.title, doc.metaDescription].filter(Boolean) as string[];
  return fields.map((field) => canonicalizeSearchValue(field)).filter(Boolean);
};

const fuseOptions: Fuse.IFuseOptions<SearchDoc & { normalized: string[] }> = {
  includeScore: true,
  shouldSort: true,
  threshold: 0.32,
  distance: 80,
  ignoreLocation: true,
  keys: [
    { name: "title", weight: 0.5 },
    { name: "metaDescription", weight: 0.3 },
    { name: "normalized", weight: 0.7 },
  ],
  getFn: (obj, path: any) => {
    if (path === "normalized") return (obj as any).normalized;
    const value = (obj as any)[path];
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  },
};

export const buildSearchIndex = (docs: SearchDoc[]) => {
  const enriched = docs.map((doc) => ({
    ...doc,
    normalized: buildNormalizedFields(doc),
  }));
  return new Fuse(enriched, fuseOptions);
};

export const runFuzzySearch = (
  query: string,
  docs: SearchDoc[],
  limit = 10
): RankedSearchResult[] => {
  const normalizedQuery = canonicalizeSearchValue(query);
  if (normalizedQuery.length < 2) return [];

  const fuse = buildSearchIndex(docs);
  const results = fuse.search(normalizedQuery).slice(0, limit);

  return results.map((hit) => ({
    id: hit.item.id,
    title: hit.item.title,
    slug: hit.item.slug,
    typeLabel: hit.item.typeLabel,
    metaDescription: hit.item.metaDescription,
    score: Math.round((1 - Math.min(hit.score ?? 1, 1)) * 100),
  }));
};
