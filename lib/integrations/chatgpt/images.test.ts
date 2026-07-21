import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34" }]),
}));
vi.mock("server-only", () => ({}));

import { optimizeImage } from "./images";

describe("ChatGPT image importer", () => {
  it("accepts valid image bytes when a CDN sends a nonstandard content type", async () => {
    const imageBytes = await sharp({
      create: {
        width: 1_200,
        height: 675,
        channels: 3,
        background: { r: 28, g: 25, b: 45 },
      },
    })
      .png()
      .toBuffer();
    const fetchMock = vi.fn(async (_input: URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("user-agent")).toContain("AnimeSparksImageImporter");
      expect(headers.get("referer")).toBe("https://source.example.test/article");
      return new Response(imageBytes as unknown as BodyInit, {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await optimizeImage(
      {
        sourceUrl: "https://images.example.test/frieren.png",
        sourcePage: "https://source.example.test/article",
        alt: "Frieren beneath a night sky",
      },
      "hero",
    );

    expect(result.width).toBe(1_200);
    expect(result.height).toBe(675);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
