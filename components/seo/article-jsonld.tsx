export function ArticleJsonLd({
  url,
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  inLanguage,
}: {
  url: string;
  title: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  inLanguage?: string;
}) {
  const author =
    authorName || authorUrl
      ? {
          "@type": "Person",
          name: authorName,
          url: authorUrl,
        }
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: url,
    headline: title,
    description: description,
    image: image ? [image] : undefined,
    inLanguage,
    datePublished,
    dateModified: dateModified || datePublished,
    author,
    publisher: {
      "@type": "Organization",
      name: "AnimeSparks",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
