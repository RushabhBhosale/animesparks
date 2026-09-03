export function ArticleJsonLd({
  url,
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  authorImage,
  authorSameAs,
  publisherUrl,
  publisherLogo,
  articleSection,
  about,
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
  authorImage?: string;
  authorSameAs?: string[];
  publisherUrl?: string;
  publisherLogo?: string;
  articleSection?: string[];
  about?: { "@type": "Thing"; name: string };
  inLanguage?: string;
}) {
  const author =
    authorName || authorUrl
      ? {
          "@type": "Person",
          name: authorName,
          url: authorUrl,
          image: authorImage,
          sameAs: authorSameAs?.length ? authorSameAs : undefined,
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
    articleSection: articleSection?.length ? articleSection : undefined,
    about,
    publisher: {
      "@type": "Organization",
      name: "AnimeSparks",
      url: publisherUrl,
      "@id": publisherUrl ? `${publisherUrl}/#organization` : undefined,
      logo: publisherLogo
        ? {
            "@type": "ImageObject",
            url: publisherLogo,
          }
        : undefined,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
