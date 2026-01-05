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
      aria-label="Advertisement"
      className={["space-y-2", className].filter(Boolean).join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        Advertisement
      </p>
      <div
        className={[
          "flex flex-col justify-between rounded-sm border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600",
          sizeClass,
        ].join(" ")}
      >
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Sponsored
          </p>
          <p className="text-sm font-semibold text-gray-800">
            Sponsor this spot.
          </p>
          <p className="text-xs text-gray-600">
            Promote your brand on AnimeSparks.
          </p>
          <p className="text-xs font-semibold text-gray-700">
            Advertise with us - just 99rs per month.
          </p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/advertise"
            className="inline-flex items-center rounded-sm border border-gray-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-800"
          >
            Advertise
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Limited slots
          </span>
        </div>
      </div>
    </aside>
  );
}
