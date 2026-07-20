import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import sharp from "sharp";

import { getIntegrationSanityClient } from "./sanity";
import type { ImageImporter, ImageSubmission, ImportedImage } from "./types";

const IMAGE_TIMEOUT_MS = 12_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  return (
    parts[0] === 0 ||
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 0 && (parts[2] === 0 || parts[2] === 2)) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19 || (parts[1] === 51 && parts[2] === 100))) ||
    (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    parts[0] >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPrivateIpv4(normalized.slice(7));
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff")
  );
}

async function assertSafeRemoteUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS image URLs are allowed.");
  if (url.username || url.password) throw new Error("Image URLs cannot contain credentials.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Image URLs must use a standard HTTP port.");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Private network image URLs are not allowed.");
  }
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network image URLs are not allowed.");
  }
  return url;
}

async function readLimitedBody(response: Response): Promise<Buffer> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) throw new Error("Image exceeds the 10 MB limit.");
  if (!response.body) throw new Error("Image response was empty.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("Image exceeds the 10 MB limit.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

async function downloadImage(sourceUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  let url = await assertSafeRemoteUrl(sourceUrl);
  const signal = AbortSignal.timeout(IMAGE_TIMEOUT_MS);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal,
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,image/gif" },
      cache: "no-store",
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location || redirect === MAX_REDIRECTS) throw new Error("Image URL redirected too many times.");
      url = await assertSafeRemoteUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!ACCEPTED_IMAGE_TYPES.has(contentType)) throw new Error("Remote response is not a supported image.");
    return { buffer: await readLimitedBody(response), contentType };
  }
  throw new Error("Image URL redirected too many times.");
}

async function optimizeImage(
  submission: ImageSubmission,
  purpose: "hero" | "article",
): Promise<{ buffer: Buffer; width: number; height: number; warnings: string[] }> {
  const downloaded = await downloadImage(submission.sourceUrl);
  const transformer = sharp(downloaded.buffer, { limitInputPixels: 50_000_000, animated: false }).rotate();
  const metadata = await transformer.metadata();
  if (!metadata.width || !metadata.height || !metadata.format) throw new Error("The downloaded file is not a valid image.");
  const warnings: string[] = [];
  if (purpose === "hero" && metadata.width < 1_000) warnings.push("Hero image is narrower than the preferred 1000 px minimum.");
  if (purpose === "hero" && metadata.width <= metadata.height) warnings.push("Hero image is not landscape orientation.");
  const maximumWidth = purpose === "hero" ? 1_600 : 1_200;
  const buffer = await transformer
    .resize({ width: maximumWidth, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: purpose === "hero" ? 82 : 80 })
    .toBuffer();
  return { buffer, width: metadata.width, height: metadata.height, warnings };
}

export function createSanityImageImporter(): ImageImporter {
  const client = getIntegrationSanityClient();
  return {
    async importImage({ image, purpose, slug, index }): Promise<ImportedImage> {
      const optimized = await optimizeImage(image, purpose);
      const filename = `${slug}-${purpose}-${index + 1}.webp`;
      const asset = await client.assets.upload("image", optimized.buffer, {
        filename,
        contentType: "image/webp",
        extract: ["image", "lqip", "palette"],
      });
      return {
        image: {
          _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: image.alt,
          sourceUrl: image.sourceUrl,
          ...(image.sourcePage ? { sourcePage: image.sourcePage } : {}),
          hostedUrl: asset.url,
          imagePurpose: purpose,
          ...(image.insertAfterHeading ? { insertAfterHeading: image.insertAfterHeading } : {}),
        },
        warnings: optimized.warnings,
      };
    },
  };
}
