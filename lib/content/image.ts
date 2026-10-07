import type { SanityImageSource } from "@sanity/image-url";
import { sanityHeroImageUrl, sanityImageUrl } from "@/sanity/lib/image";
import { getContentSource, getR2PublicBaseUrl } from "./provider";
import { resolveMongoImageUrl } from "./semantics";

type ImageOptions = Parameters<typeof sanityImageUrl>[1];

export function contentImageUrl(source: SanityImageSource, options?: ImageOptions): string | undefined {
  if (getContentSource() === "mongodb") {
    return resolveMongoImageUrl(
      source as { asset?: { r2Key?: string; url?: string; publicUrl?: string } },
      getR2PublicBaseUrl(),
    ) ?? undefined;
  }

  return sanityImageUrl(source, options);
}

export function contentHeroImageUrl(source: SanityImageSource, options?: ImageOptions): string | undefined {
  if (getContentSource() === "mongodb") {
    return resolveMongoImageUrl(
      source as { asset?: { r2Key?: string; url?: string; publicUrl?: string } },
      getR2PublicBaseUrl(),
    ) ?? undefined;
  }

  return sanityHeroImageUrl(source, options);
}
