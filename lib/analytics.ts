import "server-only";

import crypto from "crypto";
import { unstable_cache } from "next/cache";

type GaConfig = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DEFAULT_RANGE = { startDate: "30daysAgo", endDate: "yesterday" };
const TOKEN_EXPIRY_BUFFER = 60; // seconds
const VIEW_CACHE_SECONDS = 60 * 5;
const GA_FETCH_TIMEOUT_MS = 5_000;

type AnalyticsLocale = "en" | "es";

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;

const viewCache = new Map<string, { value: number; expiresAt: number }>();

const toBase64Url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

const getConfig = (): GaConfig | null => {
  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const rawKey = process.env.GA_PRIVATE_KEY;

  if (!propertyId || !clientEmail || !rawKey) return null;

  return {
    propertyId,
    clientEmail,
    privateKey: rawKey.replace(/\\n/g, "\n"),
  };
};

const getAccessToken = async (config: GaConfig) => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - TOKEN_EXPIRY_BUFFER > now) {
    return cachedToken.accessToken;
  }

  const header = toBase64Url(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  );
  const payload = toBase64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: ANALYTICS_SCOPE,
      aud: TOKEN_AUDIENCE,
      exp: now + 60 * 60,
      iat: now,
    })
  );

  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer.sign(config.privateKey);
  const jwt = `${unsignedToken}.${signature.toString("base64url")}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const res = await fetch(TOKEN_AUDIENCE, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(GA_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    console.error("[ga] Failed to fetch access token", { status: res.status });
    throw new Error("GA token fetch failed");
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("GA token missing");

  const expiresAt = now + (json.expires_in || 3600);
  cachedToken = {
    accessToken: json.access_token,
    expiresAt,
  };

  return json.access_token;
};

const buildPath = (slug: string, locale: AnalyticsLocale = "en") => {
  const trimmed = slug.replace(/^\/+|\/+$/g, "");
  return locale === "es" ? `/es/blog/${trimmed}` : `/blog/${trimmed}`;
};

export async function fetchGaPageViews(
  slugs: string[],
  locale: AnalyticsLocale = "en",
): Promise<Record<string, number>> {
  // Do not make static generation wait on an uncached external service.
  if (process.env.NEXT_PHASE === "phase-production-build") return {};
  const config = getConfig();
  if (!config) return {};

  const unique = Array.from(
    new Set(slugs.map((s) => s?.trim()).filter(Boolean))
  );
  if (!unique.length) return {};

  return getCachedGaPageViews(config.propertyId, unique, locale);
}

const getCachedGaPageViews = unstable_cache(
  async (propertyId: string, slugs: string[], locale: AnalyticsLocale) => {
    const config = getConfig();
    if (!config || config.propertyId !== propertyId) return {};
    return loadGaPageViews(config, slugs, locale);
  },
  ["animesparks-ga-page-views-v1"],
  { revalidate: VIEW_CACHE_SECONDS, tags: ["ga-page-views"] },
);

async function loadGaPageViews(
  config: GaConfig,
  unique: string[],
  locale: AnalyticsLocale,
): Promise<Record<string, number>> {
  const now = Math.floor(Date.now() / 1000);
  const cached: Record<string, number> = {};
  const toFetch: string[] = [];

  for (const slug of unique) {
    const cacheKey = `${locale}:${slug}`;
    const cachedEntry = viewCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      cached[slug] = cachedEntry.value;
    } else {
      toFetch.push(slug);
    }
  }

  if (!toFetch.length) return cached;

  try {
    const token = await getAccessToken(config);
    const pagePaths = toFetch.map((slug) => buildPath(slug, locale));

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(GA_FETCH_TIMEOUT_MS),
        body: JSON.stringify({
          dateRanges: [DEFAULT_RANGE],
          metrics: [{ name: "screenPageViews" }],
          dimensions: [{ name: "pagePath" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              inListFilter: { values: pagePaths },
            },
          },
          limit: pagePaths.length,
        }),
      }
    );

    if (!res.ok) {
      console.error("[ga] runReport failed", { status: res.status });
      return cached;
    }

    const json = (await res.json()) as {
      rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
    };

    const result = { ...cached };
    for (const row of json.rows || []) {
      const path = row.dimensionValues?.[0]?.value || "";
      const metric = row.metricValues?.[0]?.value;
      const views = Number(metric) || 0;
      const segments = path.replace(/^\/+|\/+$/g, "").split("/");
      const rowLocale = segments[0] === "es" ? "es" : "en";
      const slug =
        rowLocale === "es" && segments[1] === "blog"
          ? segments.slice(2).join("/")
          : rowLocale === "en" && segments[0] === "blog"
            ? segments.slice(1).join("/")
            : "";
      if (!slug) continue;
      result[slug] = views;
      viewCache.set(`${locale}:${slug}`, {
        value: views,
        expiresAt: now + VIEW_CACHE_SECONDS,
      });
    }

    return result;
  } catch (error) {
    console.error("[ga] Unable to load page views", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return cached;
  }
}

export async function fetchGaPageView(
  slug: string,
  locale: AnalyticsLocale = "en",
): Promise<number> {
  const data = await fetchGaPageViews([slug], locale);
  return data[slug] ?? 0;
}
