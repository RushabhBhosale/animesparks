import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheHarness = vi.hoisted(() => {
  let insideCache = false;
  const requestBoundaries: boolean[] = [];
  const unstableCache = vi.fn(
    (
      callback: (...args: any[]) => Promise<unknown>,
      _keyParts?: string[],
      _options?: { revalidate?: number; tags?: string[] },
    ) =>
      async (...args: unknown[]) => {
        insideCache = true;
        try {
          return await callback(...args);
        } finally {
          insideCache = false;
        }
      },
  );

  return {
    unstableCache,
    isInsideCache: () => insideCache,
    requestBoundaries,
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: cacheHarness.unstableCache }));

import { fetchGaPageViews } from "./analytics";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const testPrivateKey = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("Google Analytics page-view enrichment", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    vi.stubEnv("GA_PROPERTY_ID", "test-property");
    vi.stubEnv("GA_CLIENT_EMAIL", "test-account@example.invalid");
    vi.stubEnv("GA_PRIVATE_KEY", testPrivateKey);
    cacheHarness.requestBoundaries.length = 0;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads counts only inside a positive five-minute Next Data Cache entry", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      cacheHarness.requestBoundaries.push(cacheHarness.isInsideCache());
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") {
        return jsonResponse({ access_token: "test-access-token", expires_in: 3600 });
      }
      return jsonResponse({
        rows: [
          {
            dimensionValues: [{ value: "/blog/cache-regression" }],
            metricValues: [{ value: "42" }],
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const counts = await fetchGaPageViews(["cache-regression"]);

    expect(counts).toEqual({ "cache-regression": 42 });
    expect(cacheHarness.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["animesparks-ga-page-views-v1"],
      { revalidate: 300, tags: ["ga-page-views"] },
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cacheHarness.requestBoundaries).toEqual([true, true]);
    for (const call of fetchMock.mock.calls) {
      expect(call[1]).toMatchObject({ cache: "no-store" });
    }
  });

  it("returns empty data during production build without making network requests", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGaPageViews(["build-time"])).resolves.toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails soft and does not include external error details in logs", async () => {
    const fetchMock = vi.fn(async () => {
      cacheHarness.requestBoundaries.push(cacheHarness.isInsideCache());
      throw new Error("sensitive response details");
    });
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGaPageViews(["unavailable-report"])).resolves.toEqual({});
    expect(cacheHarness.requestBoundaries).toEqual([true]);
    expect(errorLog).toHaveBeenCalledWith("[ga] Unable to load page views", {
      error: "Error",
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("sensitive response details");
  });
});
