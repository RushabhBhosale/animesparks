import { client } from "@/sanity/lib/client";
import {
  sitemapEnglishBlogsQuery,
  sitemapSpanishBlogsQuery,
} from "@/sanity/blogQueries";

type SitemapPost = {
  locale: "en" | "es";
  slug: string;
  alternateSlug?: string;
  _updatedAt?: string;
};

type SitemapEntry = {
  url: string;
  lastModified?: string;
  alternates?: Array<{ hreflang: string; href: string }>;
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
  const [englishPosts, spanishPosts] = await Promise.all([
    client
      .withConfig({ useCdn: false })
      .fetch<Omit<SitemapPost, "locale">[]>(sitemapEnglishBlogsQuery),
    client
      .withConfig({ useCdn: false })
      .fetch<Omit<SitemapPost, "locale">[]>(sitemapSpanishBlogsQuery),
  ]);
  const posts: SitemapPost[] = [
    ...(englishPosts ?? []).map((post) => ({ ...post, locale: "en" as const })),
    ...(spanishPosts ?? []).map((post) => ({ ...post, locale: "es" as const })),
  ];

  const staticRoutes = [
    "/",
    "/blogs",
    "/blogs/es",
    "/my-anime-list",
    "/categories",
    "/trending",
    "/contact",
    "/about",
    "/privacy",
    "/sitemap",
  ];

  const staticEntries: SitemapEntry[] =
    staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
    }));

  const postEntries: SitemapEntry[] = posts.map((post) => {
    const currentUrl =
      post.locale === "es"
        ? `${baseUrl}/blog/es/${post.slug}`
        : `${baseUrl}/blog/${post.slug}`;
    const alternateUrl = post.alternateSlug
      ? post.locale === "es"
        ? `${baseUrl}/blog/${post.alternateSlug}`
        : `${baseUrl}/blog/es/${post.alternateSlug}`
      : undefined;
    const lastModified = toLastMod(post._updatedAt);
    const alternates = alternateUrl
      ? post.locale === "es"
        ? [
            { hreflang: "en", href: alternateUrl },
            { hreflang: "es", href: currentUrl },
            { hreflang: "x-default", href: alternateUrl },
          ]
        : [
            { hreflang: "en", href: currentUrl },
            { hreflang: "es", href: alternateUrl },
            { hreflang: "x-default", href: currentUrl },
          ]
      : [
          {
            hreflang: post.locale,
            href: currentUrl,
          },
          {
            hreflang: "x-default",
            href: currentUrl,
          },
        ];

    return {
      url: currentUrl,
      lastModified,
      alternates,
    };
  });

  const urls = [...staticEntries, ...postEntries].map(
    ({ url, lastModified, alternates }) => {
      const lastmodTag = lastModified
        ? `    <lastmod>${escapeXml(lastModified)}</lastmod>\n`
        : "";
      const alternateTags = (alternates || [])
        .map(
          (alternate: { hreflang: string; href: string }) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`
        )
        .join("\n");
      return [
        "  <url>",
        `    <loc>${escapeXml(url)}</loc>`,
        lastmodTag.trimEnd(),
        alternateTags,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    }
  );

  const urlsXml = urls.join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urlsXml}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
