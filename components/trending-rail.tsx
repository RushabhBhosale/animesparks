import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EditorialCard, type EditorialPost } from "@/components/editorial-card";

export function TrendingRail({ posts }: { posts: EditorialPost[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="trending-heading">
      <div className="editorial-section-heading">
        <div><p className="editorial-kicker">In focus</p><h2 id="trending-heading">Trending now<span className="text-anime-red">.</span></h2></div>
        <Link href="/trending">All trending <ArrowUpRight size={16} /></Link>
      </div>
      <div className="editorial-rail" tabIndex={0} role="region" aria-label="Trending articles, scroll for more">
        {posts.map((post) => <EditorialCard key={post._id} post={post} />)}
      </div>
    </section>
  );
}
