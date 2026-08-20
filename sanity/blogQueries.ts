import { groq } from "next-sanity";

const englishExcerptExpr = "coalesce(excerpt, pt::text(body))";
const englishDescriptionExpr = `coalesce(metaDescription, ${englishExcerptExpr})`;

const spanishPublishedAtExpr = "coalesce(publishedAt, originalPost->publishedAt)";
const spanishTagsExpr = "coalesce(tags, originalPost->tags)";
const spanishExcerptExpr = "pt::text(body)";
const spanishDescriptionExpr = `coalesce(metaDescription, ${spanishExcerptExpr})`;
const spanishAlternateSlugExpr = `*[
  _type == "spanishPost" &&
  defined(slug.current) &&
  originalPost._ref == ^._id &&
  ${spanishPublishedAtExpr} <= now()
][0].slug.current`;

/* ----------------------------------------
   BLOG LIST (Homepage / Blog page)
---------------------------------------- */
export const blogsQuery = groq`
*[
  _type == "post" &&
  defined(slug.current) &&
  publishedAt <= now()
]
| order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  _createdAt,
  metaDescription,
  "excerpt": ${englishDescriptionExpr},
  tags,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  categories[]->{
    _id,
    title,
    "slug": slug.current
  },
  author->{
    name,
    "slug": slug.current,
    image
  }
}
`;

export const spanishBlogsQuery = groq`
*[
  _type == "spanishPost" &&
  defined(slug.current) &&
  ${spanishPublishedAtExpr} <= now()
]
| order(${spanishPublishedAtExpr} desc) {
  _id,
  title,
  "slug": slug.current,
  "publishedAt": ${spanishPublishedAtExpr},
  _createdAt,
  metaDescription,
  "excerpt": ${spanishDescriptionExpr},
  "tags": ${spanishTagsExpr},
  "mainImage": coalesce(mainImage, originalPost->mainImage),
  "categories": coalesce(categories, originalPost->categories)[]->{
    _id,
    title,
    "slug": slug.current
  },
  "author": coalesce(author, originalPost->author)->{
    name,
    "slug": slug.current,
    image
  }
}
`;

/* ----------------------------------------
   SINGLE BLOGS (Detail page)
---------------------------------------- */
export const englishBlogBySlugQuery = groq`
*[
  _type == "post" &&
  slug.current == $slug &&
  publishedAt <= now()
][0] {
  _id,
  title,
  "slug": slug.current,
  "metaTitle": coalesce(metaTitle, title),
  "metaDescription": ${englishDescriptionExpr},
  "excerpt": ${englishExcerptExpr},
  body,
  tags,
  publishedAt,
  updatedAt,
  _createdAt,
  _updatedAt,
  "resolvedLocale": "en",
  "alternateSlug": ${spanishAlternateSlugExpr},
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  categories[]->{
    _id,
    title,
    "slug": slug.current
  },
  author->{
    name,
    bio,
    "slug": slug.current,
    image
  },
  faq[]{
    question,
    answer
  },
  "viewCount": coalesce(viewCount, 0)
}
`;

export const spanishBlogBySlugQuery = groq`
*[
  _type == "spanishPost" &&
  slug.current == $slug &&
  defined(slug.current) &&
  ${spanishPublishedAtExpr} <= now()
][0] {
  _id,
  title,
  "slug": slug.current,
  "metaTitle": coalesce(metaTitle, title),
  "metaDescription": ${spanishDescriptionExpr},
  "excerpt": ${spanishExcerptExpr},
  body,
  "tags": ${spanishTagsExpr},
  "publishedAt": ${spanishPublishedAtExpr},
  "updatedAt": coalesce(updatedAt, originalPost->updatedAt),
  _createdAt,
  _updatedAt,
  "resolvedLocale": "es",
  "alternateSlug": originalPost->slug.current,
  "mainImage": coalesce(mainImage, originalPost->mainImage),
  "categories": coalesce(categories, originalPost->categories)[]->{
    _id,
    title,
    "slug": slug.current
  },
  "author": coalesce(author, originalPost->author)->{
    name,
    bio,
    "slug": slug.current,
    image
  },
  faq[]{
    question,
    answer
  },
  "viewCount": coalesce(viewCount, 0)
}
`;

/* ----------------------------------------
   RELATED BLOGS
---------------------------------------- */
export const englishRelatedBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current) &&
  _id != $currentId &&
  (
    count(categories[@._ref in $categoryIds]) > 0 ||
    count(tags[@ in $tags]) > 0
  )
]
| order(
    (
      count(categories[@._ref in $categoryIds]) * 3 +
      count(tags[@ in $tags])
    ) desc,
    publishedAt desc
  )[0...8] {
  _id,
  title,
  "excerpt": ${englishDescriptionExpr},
  "slug": slug.current,
  publishedAt,
  mainImage {
    asset->{
      url
    },
    alt
  }
}
`;

export const spanishRelatedBlogsQuery = groq`
*[
  _type == "spanishPost" &&
  defined(slug.current) &&
  ${spanishPublishedAtExpr} <= now() &&
  _id != $currentId &&
  (
    count(coalesce(categories, originalPost->categories)[@._ref in $categoryIds]) > 0 ||
    count(${spanishTagsExpr}[@ in $tags]) > 0
  )
]
| order(
    (
      count(coalesce(categories, originalPost->categories)[@._ref in $categoryIds]) * 3 +
      count(${spanishTagsExpr}[@ in $tags])
    ) desc,
    ${spanishPublishedAtExpr} desc
  )[0...8] {
  _id,
  title,
  "excerpt": ${spanishDescriptionExpr},
  "slug": slug.current,
  "publishedAt": ${spanishPublishedAtExpr},
  "mainImage": coalesce(mainImage, originalPost->mainImage)
}
`;

/* ----------------------------------------
   BLOGS BY CATEGORY
---------------------------------------- */
export const blogsByCategoryQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  $slug in categories[]->slug.current
]
| order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage {
    asset->{
      url
    },
    alt
  }
}
`;

/* ----------------------------------------
   ALL CATEGORIES (Nav / Category page)
---------------------------------------- */
export const categoriesQuery = groq`
*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}
`;

/* ----------------------------------------
   CATEGORIES WITH POST COUNTS
---------------------------------------- */
export const categoriesWithCountsQuery = groq`
*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  "postCount": count(*[
    _type == "post" &&
    publishedAt <= now() &&
    references(^._id)
  ])
}
`;

export const categoriesWithCoversQuery = groq`
*[_type=="category"]|order(title asc){
  _id,
  title,
  "slug": slug.current,
  "postCount": count(*[_type=="post" && references(^._id)]),
  "cover": *[_type=="post" && references(^._id) && defined(mainImage.asset)]|order(publishedAt desc)[0]{
    title,
    "slug": slug.current,
    publishedAt,
    mainImage
  }
}
`;

/* ----------------------------------------
   CATEGORY BY SLUG
---------------------------------------- */
export const categoryBySlugQuery = groq`
*[_type == "category" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description
}
`;

/* ----------------------------------------
   BLOGS BY TAG
---------------------------------------- */
export const blogsByTagQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  $tagValue in tags
]
| order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage {
    asset->{
      url
    },
    alt
  }
}
`;

/* ----------------------------------------
   LATEST BLOGS (Sidebar / Footer)
---------------------------------------- */
export const latestBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current)
]
| order(publishedAt desc)[0...18] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  "excerpt": ${englishDescriptionExpr},
  author->{
    name,
    image
  },
  "viewCount": coalesce(viewCount, 0),
  mainImage {
    asset->{ url },
    alt
  },
  categories[]->{
    _id,
    title,
    "slug": slug.current
  }
}
`;

/* ----------------------------------------
   BLOGS BY SLUGS (Order preserved by input)
---------------------------------------- */
export const blogsBySlugsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current) &&
  slug.current in $slugs
] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  "excerpt": ${englishDescriptionExpr},
  author->{
    name,
    image
  },
  mainImage {
    asset->{ url },
    alt
  },
  categories[]->{
    _id,
    title,
    "slug": slug.current
  }
}
`;

/* ----------------------------------------
   HOMEPAGE SETTINGS (Curated blocks)
---------------------------------------- */
export const homepageSettingsQuery = groq`
*[_type == "homepageSettings"][0] {
  editorsPicks[]->{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    "excerpt": ${englishDescriptionExpr},
    mainImage {
      asset->{ url },
      alt
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  },
  moreBlogs[]->{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    "excerpt": ${englishDescriptionExpr},
    mainImage {
      asset->{ url },
      alt
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
}
`;

/* ----------------------------------------
   Trending BLOGS (Sidebar / Footer)
---------------------------------------- */
export const trendingBlogsQuery = groq`
*[
  _type == "post" &&
  defined(slug.current) &&
  publishedAt <= now()
]
| order(coalesce(viewCount, 0) desc, publishedAt desc)[0...10] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  "excerpt": ${englishDescriptionExpr},
  categories[]->{
    _id,
    title,
    "slug": slug.current
  },
  "viewCount": coalesce(viewCount, 0),
  mainImage {
    asset-> { url },
    alt
  }
}
`;

/* ----------------------------------------
   SITEMAP
---------------------------------------- */
export const sitemapEnglishBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current)
] {
  "slug": slug.current,
  "alternateSlug": ${spanishAlternateSlugExpr},
  _updatedAt
}
`;

export const sitemapSpanishBlogsQuery = groq`
*[
  _type == "spanishPost" &&
  defined(slug.current) &&
  ${spanishPublishedAtExpr} <= now()
] {
  "slug": slug.current,
  "alternateSlug": originalPost->slug.current,
  _updatedAt
}
`;

export const englishBlogSlugsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current)
] {
  "slug": slug.current
}
`;

export const spanishBlogSlugsQuery = groq`
*[
  _type == "spanishPost" &&
  defined(slug.current) &&
  ${spanishPublishedAtExpr} <= now()
] {
  "slug": slug.current
}
`;

/* ----------------------------------------
   SITEMAP PAGE (Published posts)
---------------------------------------- */
export const sitemapPageBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current)
]
| order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt
}
`;

/* ----------------------------------------
   RSS (Published posts with excerpts)
---------------------------------------- */
export const rssBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current)
]
| order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  _updatedAt,
  "excerpt": ${englishExcerptExpr}
}
`;

/* ----------------------------------------
   ANIME LIST
---------------------------------------- */
export const animeListQuery = groq`
*[_type == "animeEntry"] | order(title asc) {
  _id,
  title,
  score,
  coverImage,
  bannerImage,
  genres,
  year
}
`;
