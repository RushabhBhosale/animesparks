import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Search pages remain crawlable so search engines can see their
      // noindex directive. Private tools and API responses are not useful
      // search documents.
      disallow: ["/api/", "/studio/"],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
