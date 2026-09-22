import { Pagination } from "@/components/pagination";
import type { PaginationInfo } from "@/lib/pagination";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { EditorialCard } from "@/components/editorial-card";
import type { BlogPost, TrendingRange } from "./types";

type FilterValue = "recent" | "popular" | "discussed" | "visual" | "all";
type TrendingContentProps = { posts: BlogPost[]; pagination: PaginationInfo; range: TrendingRange; currentSort?: FilterValue };

export function TrendingContent({ posts, pagination, range, currentSort = "popular" }: TrendingContentProps) {
  const ranges: { value: TrendingRange; label: string }[] = [
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
  ];
  const hrefForRange = (value: TrendingRange) => {
    const params = new URLSearchParams();
    if (value !== "month") params.set("range", value);
    if (currentSort !== "popular") params.set("sort", currentSort);
    return `/trending${params.size ? `?${params}` : ""}`;
  };
  return (
    <>
      <PageHero eyebrow="In focus" title="The stories drawing attention" description="Explore the articles readers are spending time with." />
      <section className="editorial-shell editorial-archive" aria-labelledby="trending-articles-heading">
        <nav className="editorial-filters" aria-label="Trending period">
          {ranges.map((option) => <Link key={option.value} href={hrefForRange(option.value)} scroll={false} aria-current={range === option.value ? "page" : undefined}>{option.label}</Link>)}
          <span>{pagination.total} blogs</span>
        </nav>
        <h2 id="trending-articles-heading" className="sr-only">Trending articles</h2>
        <div className="editorial-grid">{posts.map((post, index) => <EditorialCard key={post._id} post={post} priority={index === 0} />)}</div>
        <Pagination pagination={pagination} path="/trending" query={{ range: range !== "month" ? range : undefined, sort: currentSort !== "popular" ? currentSort : undefined }} />
        <Link href="/blogs" className="editorial-archive-link">Explore the full archive <ArrowUpRight size={18} /></Link>
      </section>
    </>
  );
}
