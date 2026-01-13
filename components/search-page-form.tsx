"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  initialQuery: string;
};

const DEBOUNCE_MS = 1500;

export function SearchPageForm({ initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const lastSent = useRef(
    initialQuery.trim().length >= 2
      ? `${pathname}?q=${encodeURIComponent(initialQuery.trim())}`
      : pathname
  );

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const trimmed = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const target =
        trimmed.length >= 2
          ? `${pathname}?q=${encodeURIComponent(trimmed)}`
          : pathname;
      if (target === lastSent.current) return;
      router.replace(target, { scroll: false });
      lastSent.current = target;
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [trimmed, pathname, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed.length >= 2) {
      const target = `${pathname}?q=${encodeURIComponent(trimmed)}`;
      lastSent.current = target;
      router.replace(target, { scroll: false });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mb-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white focus-within:border-white/30 focus-within:bg-white/[0.04] transition-colors"
    >
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search anime or kdrama titles, characters, and articles"
        className="bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none w-full"
        minLength={2}
        autoFocus
        aria-label="Search anime or kdrama titles, characters, and articles"
        suppressHydrationWarning
      />
      <button
        type="submit"
        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 md:hover:text-white md:hover:border-white/30 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
