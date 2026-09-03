import { client } from "@/sanity/lib/client";
import { rssBlogsQuery } from "@/sanity/blogQueries";
import { getBaseUrl } from "@/utils/seo";

type RssPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  _updatedAt?: string;
  excerpt?: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toRfc822 = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toUTCString();
};

const buildExcerpt = (value?: string) => {
  if (!value) return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 240) return trimmed;
  return `${trimmed.slice(0, 237)}...`;
};

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();
  const posts: RssPost[] = await client.fetch(rssBlogsQuery);

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const title = escapeXml(post.title || "Untitled");
      const description = escapeXml(buildExcerpt(post.excerpt));
      const pubDate = toRfc822(post.publishedAt);
      const lastBuildDate = toRfc822(post._updatedAt || post.publishedAt);

      return [
        "  <item>",
        `    <title>${title}</title>`,
        `    <link>${link}</link>`,
        `    <guid>${link}</guid>`,
        pubDate ? `    <pubDate>${pubDate}</pubDate>` : "",
        lastBuildDate ? `    <dc:date>${lastBuildDate}</dc:date>` : "",
        description ? `    <description>${description}</description>` : "",
        "  </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
    `  <channel>\n` +
    `    <title>AnimeSparks</title>\n` +
    `    <link>${baseUrl}</link>\n` +
    `    <description>Editorial anime analysis on storytelling, character arcs, and dark shonen.</description>\n` +
    `    <language>en-IN</language>\n` +
    `    <lastBuildDate>${toRfc822(new Date().toISOString())}</lastBuildDate>\n` +
    `${items}\n` +
    `  </channel>\n` +
    `</rss>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
    },
  });
}
