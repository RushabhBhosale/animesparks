import { Pagination } from "@/components/pagination";
import type { PaginationInfo } from "@/lib/pagination";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { EditorialCard, type EditorialPost } from "@/components/editorial-card";

type Category = { _id: string; title: string; slug: string };

export function ArticleArchive({ posts, pagination, categories, tags = [], locale = "en", query, activeSort = "all" }: {
  posts: EditorialPost[];
  pagination: PaginationInfo;
  categories: Category[];
  tags?: string[];
  locale?: "en" | "es";
  query?: string;
  activeSort?: string;
}) {
  const es = locale === "es";
  const base = es ? "/blogs/es" : "/blogs";
  const sortHref = (sort: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "all") params.set("sort", sort);
    return `${base}${params.size ? `?${params}` : ""}`;
  };
  return (
    <main lang={locale} className="bg-anime-ink text-anime-text">
      <PageHero eyebrow={es ? "El archivo editorial" : "The editorial archive"} title={es ? "Blogs en español" : "Blogs"} description={es ? "Análisis, personajes y las ideas detrás de tus series favoritas." : "Analysis, character studies, and the ideas behind the anime."} />
      <div className="editorial-shell editorial-archive">
        <div className="editorial-columns">
          <section className="min-w-0" aria-label={es ? "Artículos" : "Blogs"}>
            <h2 className="sr-only">{es ? "Artículos" : "Blogs"}</h2>
            <nav className="editorial-filters" aria-label={es ? "Orden de artículos" : "Article order"}>
              <Link href={sortHref("all")} aria-current={activeSort === "all" ? "page" : undefined}>{es ? "Todos los artículos" : "All blogs"}</Link>
              {!es && <Link href={sortHref("recent")} aria-current={activeSort === "recent" ? "page" : undefined}>Newest first</Link>}
              <span>{pagination.total} {es ? "blogs" : "blogs"}</span>
            </nav>
            {query && <p className="mb-6 text-sm text-white/65">{es ? "Resultados para" : "Results for"} “{query}” · <Link href={base} className="underline">{es ? "Borrar búsqueda" : "Clear search"}</Link></p>}
            {posts.length > 0 ? <div className="editorial-list">{posts.map((post, index) => <EditorialCard key={post._id} post={post} layout="row" locale={locale} priority={index === 0} />)}</div> : <p className="py-8 text-white/65">{es ? "No se encontraron artículos." : "No articles found for this search."}</p>}
            <Pagination pagination={pagination} path={base} query={{ q: query, sort: activeSort !== "all" ? activeSort : undefined }} locale={locale} />
          </section>
          <aside className="editorial-sidebar">
            <section className="editorial-side-panel">
              <p className="editorial-kicker">{es ? "Explorar" : "Explore"}</p><h2>{es ? "Secciones editoriales" : "Editorial sections"}</h2>
              <div className="editorial-section-links">{categories.map((category) => <Link key={category._id} href={`/categories/${category.slug}`}>{category.title}<ArrowUpRight size={15} /></Link>)}</div>
            </section>
            {tags.length > 0 && <section className="editorial-side-panel"><p className="editorial-kicker">Further reading</p><h2>Explore a topic</h2><div className="mt-5 flex flex-wrap gap-2">{tags.map((tag) => <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="border border-white/15 px-3 py-2 text-xs text-white/70 hover:text-anime-lime">{tag}</Link>)}</div></section>}
            <section className="editorial-rss"><p className="editorial-kicker">{es ? "Ediciones" : "Editions"}</p><h2>{es ? "Elige tu idioma" : "Read in your language"}</h2><div className="editorial-section-links"><Link href="/blogs" hrefLang="en">English <ArrowUpRight size={15} /></Link><Link href="/blogs/es" hrefLang="es">Español <ArrowUpRight size={15} /></Link></div></section>
          </aside>
        </div>
      </div>
    </main>
  );
}
