import Link from "next/link";

type AdSlotVariant = "sidebar" | "inline" | "full";

const sizeClasses: Record<AdSlotVariant, string> = {
  sidebar: "min-h-[250px] w-full sm:w-[300px]",
  inline: "min-h-[220px] w-full",
  full: "min-h-[220px] w-full",
};

type AdSlotProps = {
  variant: AdSlotVariant;
  className?: string;
};

export function AdSlot({ variant, className }: AdSlotProps) {
  const sizeClass = sizeClasses[variant];

  return (
    <aside
      aria-label="Advertisement placeholder"
      className={["space-y-2", className].filter(Boolean).join(" ")}
    >
      <div
        className={[
          "flex flex-col justify-between rounded-sm border border-solid border-gray-300 bg-gray-50 p-4 text-xs text-gray-600",
          sizeClass,
        ].join(" ")}
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Ad Placeholder
          </p>
          <p className="text-sm font-medium text-gray-800">
            This space is reserved for ads
          </p>
          <p className="text-xs text-gray-600">
            Advertisements will appear here in the future.
          </p>
        </div>

        <div className="flex items-center justify-end pt-2">
          <span className="text-[11px] uppercase tracking-wider text-gray-400">
            AnimeSparks
          </span>
        </div>
      </div>
    </aside>
  );
}
