"use client";

import { useEffect } from "react";

type AdSlotVariant = "sidebar" | "inline" | "full" | "vertical";

const sizeClasses: Record<AdSlotVariant, string> = {
  sidebar: "min-h-[250px] w-full sm:w-[300px]",
  inline: "min-h-[220px] w-full",
  full: "min-h-[220px] w-full",
  vertical: "min-h-[400px]! w-full",
};

type AdSlotProps = {
  variant: AdSlotVariant;
  className?: string;
  insClassName?: string;
  slot: string; // AdSense ad slot ID
};

export function AdSlot({
  variant,
  className,
  insClassName,
  slot,
}: AdSlotProps) {
  const sizeClass = sizeClasses[variant];

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense error", e);
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      className={["my-6", className].filter(Boolean).join(" ")}
    >
      <ins
        className={["adsbygoogle", sizeClass, insClassName]
          .filter(Boolean)
          .join(" ")}
        style={{ display: "block" }}
        data-ad-client="ca-pub-1425611919231559"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
