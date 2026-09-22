import { EditorialCard } from "@/components/editorial-card";
import type { BlogPost } from "./types";

type BlogListContentProps = {
  posts: BlogPost[];
  initialVisible?: number;
  locale?: "en" | "es";
};

export function BlogListContent({ posts, locale = "en" }: BlogListContentProps) {
  if (!posts.length) return null;
  return <div className="editorial-list">{posts.map((post) => <EditorialCard key={post._id} post={post} layout="row" locale={locale} />)}</div>;
}
