import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { sanityImageUrl } from "@/sanity/lib/image";
import { formatPostDate } from "@/utils/date";

export type EditorialPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  mainImage?: { asset?: { url?: string }; alt?: string };
  categories?: { title?: string; slug?: string }[];
  author?: { name?: string };
};

export function EditorialCard({ post, layout = "grid", locale = "en", priority = false }: {
  post: EditorialPost;
  layout?: "grid" | "row";
  locale?: "en" | "es";
  priority?: boolean;
}) {
  const href = locale === "es" ? `/es/blog/${post.slug}` : `/blog/${post.slug}`;
  return (
    <article className={`editorial-card editorial-card--${layout}`}>
      {post.mainImage?.asset?.url && (
        <Link href={href} prefetch={false} className="editorial-card-image" aria-label={post.title} tabIndex={-1}>
          <Image src={sanityImageUrl(post.mainImage, { width: 900 })} alt={post.mainImage.alt || post.title} fill priority={priority} sizes={layout === "row" ? "(max-width: 640px) 90vw, 300px" : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"} className="object-cover" />
        </Link>
      )}
      <div className="editorial-card-copy">
        <div className="editorial-meta">
          {post.categories?.[0]?.title && <span className="editorial-category">{post.categories[0].title}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}
        </div>
        <h3><Link href={href} prefetch={false}>{post.title}</Link></h3>
        {post.excerpt && <p className="editorial-excerpt">{post.excerpt}</p>}
        <div className="editorial-card-bottom">
          <span>{post.author?.name || (locale === "es" ? "AnimeSparks · Editorial" : "AnimeSparks Editorial")}</span>
          <Link href={href} prefetch={false} aria-label={`${locale === "es" ? "Leer" : "Read"}: ${post.title}`}><ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}
