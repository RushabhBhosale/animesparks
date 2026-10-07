import { afterEach, describe, expect, it, vi } from "vitest";

const sanityImageMock = vi.hoisted(() => ({
  sanityImageUrl: vi.fn(() => "https://cdn.sanity.io/images/project/dataset/fallback.webp"),
  sanityHeroImageUrl: vi.fn(() => "https://cdn.sanity.io/images/project/dataset/hero-fallback.webp"),
}));

vi.mock("@/sanity/lib/image", () => sanityImageMock);

import { contentHeroImageUrl, contentImageUrl } from "./image";

describe("content image resolver", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("routes Mongo article assets to R2 without invoking the Sanity resolver", () => {
    vi.stubEnv("CONTENT_SOURCE", "mongodb");
    vi.stubEnv("R2_PUBLIC_BASE_URL", "https://images.animesparks.blog/");
    const image = {
      asset: {
        r2Key: "sanity/abc123/hero image.webp",
        url: "https://cdn.sanity.io/images/project/dataset/old-image.webp",
      },
    };

    expect(contentHeroImageUrl(image)).toBe("https://images.animesparks.blog/sanity/abc123/hero%20image.webp");
    expect(contentImageUrl(image, { width: 1200 })).toBe("https://images.animesparks.blog/sanity/abc123/hero%20image.webp");
    expect(sanityImageMock.sanityImageUrl).not.toHaveBeenCalled();
    expect(sanityImageMock.sanityHeroImageUrl).not.toHaveBeenCalled();
  });

  it("uses the existing Sanity transforms when Sanity is the content source", () => {
    vi.stubEnv("CONTENT_SOURCE", "sanity");
    const image = { asset: { _ref: "image-example-1200x675-webp" } };
    const options = { width: 600, quality: 70 };

    expect(contentImageUrl(image, options)).toContain("cdn.sanity.io");
    expect(sanityImageMock.sanityImageUrl).toHaveBeenCalledWith(image, options);
    expect(contentHeroImageUrl(image)).toContain("cdn.sanity.io");
    expect(sanityImageMock.sanityHeroImageUrl).toHaveBeenCalledWith(image, undefined);
  });
});
