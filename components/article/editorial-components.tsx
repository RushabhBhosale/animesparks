import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function SpoilerNotice({
  children,
  label = "Spoiler level",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <aside className="my-8 border-y border-amber-200/25 bg-amber-100/[0.035] px-4 py-4 sm:px-5" aria-label="Spoiler warning">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200/80">
            {label}
          </p>
          <div className="text-sm leading-relaxed text-white/70">{children}</div>
        </div>
      </div>
    </aside>
  );
}

export function QuickAnswer({
  children,
  label = "Quick answer",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <aside className="my-9 border-l-2 border-[#ccff00] bg-white/[0.035] px-5 py-5 sm:px-6" aria-label="Quick answer">
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#ccff00]">
        {label}
      </p>
      <div className="text-base leading-relaxed text-white/80">{children}</div>
    </aside>
  );
}

export type ReleaseStatusItem = {
  label: string;
  value: string;
};

export function ReleaseStatus({
  heading = "Release status",
  items,
}: {
  heading?: string;
  items: ReleaseStatusItem[];
}) {
  if (!items.length) return null;

  return (
    <section className="my-9 border-y border-white/10 py-5" aria-label={heading}>
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
        {heading}
      </p>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[7rem_1fr] gap-3 border-t border-white/8 pt-3">
            <dt className="text-sm text-white/45">{item.label}</dt>
            <dd className="text-sm font-bold text-white/85">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
