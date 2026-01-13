"use client";

import { useEffect } from "react";

type Props = {
  slug: string;
};

export function ViewTracker({ slug }: Props) {
  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Swallow errors; view count is non-critical.
    });

    return () => controller.abort();
  }, [slug]);

  return null;
}
