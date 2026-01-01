export const siteName = "AnimeSparks";
export const siteDescription =
  "Editorial anime analysis, reviews, lists, and character breakdowns with a focus on dark shonen storytelling.";
export const defaultOgImage = "/anime-poster.jpg";
export const siteAuthorName = "Rushabh Bhosale";
export const siteAuthorUrl = "https://www.rushabh.in/home";

export const getBaseUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return siteUrl.replace(/\/$/, "");
};
