export type SearchCandidate = {
  id: string;
  text: string;
  alt?: string[];
};

export type RankedResult = {
  id: string;
  text: string;
  score: number;
};

const synonymMap: Record<string, string> = {
  kdrama: "kdrama",
  kdramas: "kdrama",
  kdramac: "kdrama",
  jjk: "jujutsukaisen",
  aot: "attackontitan",
  op: "onepiece",
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const canonicalize = (value: string) => {
  const normalized = normalize(value);
  return synonymMap[normalized] || normalized;
};

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
    dp[0] = i;
  }
  return dp[b.length];
};

const scorePair = (query: string, target: string) => {
  if (!query || !target) return 0;
  if (query === target) return 100;
  if (target.startsWith(query)) return Math.max(90, 80 + Math.min(query.length, 10));
  if (target.includes(query)) return 75;
  const distance = levenshtein(query, target);
  if (distance > 2) return 0;
  const ratio = 1 - distance / Math.max(query.length, target.length, 1);
  return Math.round(50 + ratio * 20);
};

const bestScoreForCandidate = (query: string, candidate: SearchCandidate) => {
  const variants = [candidate.text, ...(candidate.alt || [])];
  let best = 0;
  for (const variant of variants) {
    const score = scorePair(query, canonicalize(variant));
    if (score > best) best = score;
    if (best === 100) break;
  }
  return best;
};

export const rankFuzzy = (query: string, candidates: SearchCandidate[], topN = 10): RankedResult[] => {
  const normalizedQuery = canonicalize(query);
  if (normalizedQuery.length < 1) return [];
  const scored = candidates
    .map((candidate) => ({
      id: candidate.id,
      text: candidate.text,
      score: bestScoreForCandidate(normalizedQuery, candidate),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text));
  return scored.slice(0, topN);
};
