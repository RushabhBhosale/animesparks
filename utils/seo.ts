export const siteName = "AnimeSparks";
export const siteDescription =
  "Editorial anime analysis, reviews, lists, and character breakdowns with a focus on dark shonen storytelling.";
export const defaultOgImage = "/anime-poster.jpg";
export const siteAuthorName = "Rushabh Bhosale";
export const siteAuthorUrl = "https://www.rushabh.in/home";
export const productionSiteUrl = "https://www.animesparks.blog";

export const getBaseUrl = () => {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredSiteUrl) return productionSiteUrl;

  try {
    const url = new URL(configuredSiteUrl);
    if (url.hostname === "animesparks.blog" || url.hostname === "www.animesparks.blog") {
      return productionSiteUrl;
    }
    return url.origin;
  } catch {
    return productionSiteUrl;
  }
};
