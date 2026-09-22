"use client";

import { Check, Copy, Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export type ArticleTocItem = {
  id: string;
  label: string;
  index: number;
};

type ArticleTocProps = {
  items: ArticleTocItem[];
  heading: string;
};

export function ArticleToc({ items, heading }: ArticleTocProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length < 3) return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -70% 0px", threshold: [0, 1] },
    );

    headings.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  const links = (
    <ol className="article-toc-links space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={`group grid grid-cols-[2rem_1fr] gap-2 py-1.5 text-sm leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ccff00] ${
              activeId === item.id
                ? "text-white"
                : "text-white/55 hover:text-white"
            }`}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            <span
              className={`font-mono text-[11px] tabular-nums ${
                activeId === item.id ? "text-[#ccff00]" : "text-white/30"
              }`}
            >
              {String(item.index).padStart(2, "0")}
            </span>
            <span>{item.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <details className="article-mobile-toc border border-white/15 bg-[#101010] px-4 py-1 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white marker:hidden">
          {heading}
          <span className="text-[#ccff00]" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="pb-4 pt-1">{links}</div>
      </details>

      <nav aria-label={heading} className="article-toc-desktop hidden lg:block">
        <p className="mb-4 border-b border-white/10 pb-3 text-xs font-black uppercase tracking-[0.2em] text-white">
          {heading}
        </p>
        {links}
      </nav>
    </>
  );
}

type ArticleShareControlsProps = {
  title: string;
  url: string;
  shareLabel: string;
  copyLabel: string;
  copiedLabel: string;
};

export function ArticleShareControls({
  title,
  url,
  shareLabel,
  copyLabel,
  copiedLabel,
}: ArticleShareControlsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(copyLabel, url);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }

    await copyLink();
  };

  const controlClass =
    "inline-flex min-h-10 items-center justify-center gap-2 border border-white/15 bg-transparent px-3.5 text-xs font-semibold text-white/75 transition-colors hover:border-white/30 hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ccff00]";

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={shareLabel}>
      <button type="button" onClick={share} className={controlClass}>
        <Share2 className="size-4" aria-hidden="true" />
        {shareLabel}
      </button>
      <button type="button" onClick={copyLink} className={controlClass}>
        {copied ? (
          <Check className="size-4 text-[#ccff00]" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        {copied ? copiedLabel : copyLabel}
      </button>
      <Link2 className="ml-1 hidden size-4 text-white/25 sm:block" aria-hidden="true" />
    </div>
  );
}
