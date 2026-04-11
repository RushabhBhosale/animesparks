"use client";

import { useEffect, useId, useRef } from "react";

const ADSENSE_CLIENT = "ca-pub-1425611919231559";
const DEFAULT_AD_SLOT = "2056567409";

type AdsByGoogleWindow = Window &
  typeof globalThis & {
    adsbygoogle?: Array<Record<string, unknown>>;
    __adsenseInitializedBlocks__?: Set<string>;
  };

type AdBlockProps = {
  className?: string;
  instanceId?: string;
  slot?: string;
};

export function AdBlock({
  className,
  instanceId,
  slot = DEFAULT_AD_SLOT,
}: AdBlockProps) {
  const fallbackId = useId();
  const adRef = useRef<HTMLModElement | null>(null);
  const resolvedInstanceId = instanceId ?? fallbackId;

  useEffect(() => {
    const adElement = adRef.current;

    if (!adElement) {
      return;
    }

    const adsWindow = window as AdsByGoogleWindow;
    const initializedBlocks =
      adsWindow.__adsenseInitializedBlocks__ ??= new Set<string>();

    if (
      initializedBlocks.has(resolvedInstanceId) ||
      Boolean(adElement.dataset.adsbygoogleStatus)
    ) {
      initializedBlocks.add(resolvedInstanceId);
      return;
    }

    try {
      (adsWindow.adsbygoogle = adsWindow.adsbygoogle || []).push({});
      initializedBlocks.add(resolvedInstanceId);
    } catch {
      // AdSense can fail silently during local/dev rendering before inventory is available.
    }
  }, [resolvedInstanceId]);

  return (
    <aside
      aria-label="Advertisement"
      className={className ?? "my-10"}
    >
      <div className="rounded-sm border border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
        <div className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">
          <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
          Advertisement
          <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
        </div>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="fluid"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
