/**
 * Leave dynamic article routes for on-demand ISR generation.
 * Sitemap and RSS queries remain responsible for enumerating published content.
 */
export function getInitialBlogStaticParams(): Array<{ slug: string }> {
  return [];
}
