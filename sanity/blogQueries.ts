// lib/sanity/queries.ts
import { groq } from "next-sanity";

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

/* ----------------------------------------
   SINGLE BLOG (Detail page)
---------------------------------------- */
export const blogBySlugQuery = groq`
*[
  _type == "post" &&
  slug.current == $slug &&
  publishedAt <= now()
][0] {
  _id,
  title,
  "slug": slug.current,
  "excerpt": pt::text(body),
  body,
  tags,
  publishedAt,
  _createdAt,
  _updatedAt,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  categories[]->{
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
  }
}
`;

/* ----------------------------------------
   RELATED BLOGS (Same category)
---------------------------------------- */
export const relatedBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current) &&
  _id != $currentId &&
  count(categories[@._ref in $categoryIds]) > 0
]
| order(publishedAt desc)[0...3] {
  title,
  "slug": slug.current,
  publishedAt
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
  $tag in tags
]
| order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt
}
`;

/* ----------------------------------------
   LATEST BLOGS (Sidebar / Footer)
---------------------------------------- */
export const latestBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now()
]
| order(publishedAt desc)[0...5] {
  title,
  "slug": slug.current
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
| order(publishedAt desc)[0...8] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage {
    asset-> { url },
    alt
  }
}
`;

/* ----------------------------------------
   SITEMAP (Minimal fields)
---------------------------------------- */
export const sitemapBlogsQuery = groq`
*[
  _type == "post" &&
  publishedAt <= now() &&
  defined(slug.current)
] {
  "slug": slug.current,
  _updatedAt
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
  "excerpt": pt::text(body)
}
`;
