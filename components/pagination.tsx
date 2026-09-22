import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listingHref, type ListingSearchParams, type PaginationInfo } from "@/lib/pagination";

export function Pagination({ pagination, path, query = {}, locale = "en", pageKey = "page", label }: {
  pagination: PaginationInfo;
  path: string;
  query?: ListingSearchParams;
  locale?: "en" | "es";
  pageKey?: string;
  label?: string;
}) {
  const { page, pageCount, total, start, end } = pagination;
  if (pageCount <= 1) return null;
  const es = locale === "es";
  const pages = Array.from(new Set([1, pageCount, page - 1, page, page + 1, ...(page <= 2 ? [2, 3] : []), ...(page >= pageCount - 1 ? [pageCount - 2] : [])]))
    .filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  const entries: (number | string)[] = [];
  pages.forEach((value, index) => {
    if (index && value - pages[index - 1] > 1) entries.push(`gap-${value}`);
    entries.push(value);
  });
  const href = (value: number) => listingHref(path, query, value, pageKey);
  return (
    <nav className="listing-pagination" aria-label={label || (es ? "Paginación de blogs" : "Blog pagination")}>
      <div className="pagination-summary"><span>{es ? "Mostrando" : "Showing"} {start}–{end} {es ? "de" : "of"} {total}</span><span>{es ? "Página" : "Page"} {page} {es ? "de" : "of"} {pageCount}</span></div>
      <div className="pagination-navigation">
        {page > 1 ? <Link href={href(page - 1)} prefetch={false} rel="prev" className="pagination-direction"><ChevronLeft size={16} aria-hidden="true" />{es ? "Anterior" : "Previous"}</Link> : <span className="pagination-direction" aria-disabled="true"><ChevronLeft size={16} aria-hidden="true" />{es ? "Anterior" : "Previous"}</span>}
        <ol className="pagination-pages">{entries.map((entry) => <li key={entry}>{typeof entry === "number" ? <Link href={href(entry)} prefetch={false} aria-label={`${es ? "Página" : "Page"} ${entry}`} aria-current={entry === page ? "page" : undefined}>{entry}</Link> : <span aria-hidden="true">…</span>}</li>)}</ol>
        {page < pageCount ? <Link href={href(page + 1)} prefetch={false} rel="next" className="pagination-direction">{es ? "Siguiente" : "Next"}<ChevronRight size={16} aria-hidden="true" /></Link> : <span className="pagination-direction" aria-disabled="true">{es ? "Siguiente" : "Next"}<ChevronRight size={16} aria-hidden="true" /></span>}
      </div>
    </nav>
  );
}
