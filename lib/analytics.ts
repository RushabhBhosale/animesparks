import "server-only";

import crypto from "crypto";

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
  });

  if (!res.ok) {
    console.error("[ga] Failed to fetch access token", await res.text());
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

const buildPath = (slug: string) => {
  const trimmed = slug.replace(/^\/+|\/+$/g, "");
  return `/blog/${trimmed}`;
};

export async function fetchGaPageViews(
  slugs: string[]
): Promise<Record<string, number>> {
  const config = getConfig();
  if (!config) return {};

  const unique = Array.from(
    new Set(slugs.map((s) => s?.trim()).filter(Boolean))
  );
  if (!unique.length) return {};

  const now = Math.floor(Date.now() / 1000);
  const cached: Record<string, number> = {};
  const toFetch: string[] = [];

  for (const slug of unique) {
    const cachedEntry = viewCache.get(slug);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      cached[slug] = cachedEntry.value;
    } else {
      toFetch.push(slug);
    }
  }

  if (!toFetch.length) return cached;

  try {
    const token = await getAccessToken(config);
    const pagePaths = toFetch.map(buildPath);

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
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
      console.error("[ga] runReport failed", await res.text());
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
      const slug = path.replace(/^\/+|\/+$/g, "").replace(/^blog\//, "");
      if (!slug) continue;
      result[slug] = views;
      viewCache.set(slug, { value: views, expiresAt: now + VIEW_CACHE_SECONDS });
    }

    return result;
  } catch (error) {
    console.error("[ga] Unable to load page views", error);
    return cached;
  }
}

export async function fetchGaPageView(slug: string): Promise<number> {
  const data = await fetchGaPageViews([slug]);
  return data[slug] ?? 0;
}
