import { client } from "@/sanity/lib/client";
import { sitemapBlogsQuery } from "@/sanity/blogQueries";

type SitemapPost = {
  slug: string;
  _updatedAt?: string;
};

const getBaseUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return siteUrl.replace(/\/$/, "");
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toLastMod = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();
  const posts: SitemapPost[] = await client
    .withConfig({ useCdn: false })
    .fetch(sitemapBlogsQuery);

  const staticRoutes = [
    "/",
    "/blogs",
    "/my-anime-list",
    "/categories",
    "/trending",
    "/about",
    "/privacy",
    "/sitemap",
  ];

  const staticEntries: Array<{ url: string; lastModified?: string }> =
    staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
    }));

  const postEntries: Array<{ url: string; lastModified?: string }> = posts.map(
    (post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: toLastMod(post._updatedAt),
    })
  );

  const urls = [...staticEntries, ...postEntries].map(
    ({ url, lastModified }) => {
      const lastmodTag = lastModified
        ? `    <lastmod>${escapeXml(lastModified)}</lastmod>\n`
        : "";
      return [
        "  <url>",
        `    <loc>${escapeXml(url)}</loc>`,
        lastmodTag.trimEnd(),
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    }
  );

  const urlsXml = urls.join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urlsXml}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
