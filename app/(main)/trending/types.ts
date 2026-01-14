export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  metaDescription?: string;
  tags?: string[];
  _createdAt?: string;
  categories?: {
    title?: string;
    slug?: string;
  }[];
  viewCount?: number;
  author?: {
    name?: string;
  };
  mainImage?: {
    asset?: { url?: string };
    alt?: string;
  };
};
