export type BlogCategory = {
  _id: string;
  title: string;
  slug: string;
};

export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  metaDescription?: string;
  mainImage?: {
    asset?: { url?: string };
    alt?: string;
  };
  categories?: BlogCategory[];
  tags?: string[];
  _createdAt?: string;
};
