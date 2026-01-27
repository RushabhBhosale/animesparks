import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { defaultOgImage, siteName } from "@/utils/seo";

const metaTitle = "Contact";
const metaDescription =
  "Get in touch with AnimeSparks for questions, feedback, or collaboration inquiries related to anime content and analysis.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/contact",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
    images: [defaultOgImage],
  },
};

const contacts = [
  {
    label: "Editorial tips & pitches",
    email: "rushabhbhosale25757@gmail.com",
    note: "Send story ideas, lore deep-dives, and exclusive insights.",
  },
  {
    label: "Corrections & fact checks",
    email: "rushabhbhosale25757@gmail.com",
    note: "Flag inaccuracies with episode numbers, sources, and screenshots.",
  },
  {
    label: "Partnerships & sponsors",
    email: "rushabhbhosale25757@gmail.com",
    note: "Collaborations, sponsorships, and brand placements.",
    phone: "+91 9137996317",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Contact"
        title="Contact AnimeSparks"
        description="Direct lines to the editorial desk for pitches, sourcing, corrections, and brand conversations."
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16 space-y-12">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden border border-[#1f1f1f] bg-[#0b0b0b] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rotate-12 border-2 border-dashed border-[#1f1f1f] opacity-40" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                {item.label}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {item.note}
              </p>
              <div className="mt-4 space-y-2 text-sm font-semibold text-gray-100">
                <a
                  href={`mailto:${item.email}`}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#111] px-3 py-2 border border-[#2a2a2a] transition-colors md:hover:border-[#ccff00] md:hover:text-[#ccff00]"
                >
                  <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
                  {item.email}
                </a>
                {item.phone ? (
                  <a
                    href={`tel:${item.phone.replace(/\s+/g, "")}`}
                    className="block text-gray-300 transition-colors md:hover:text-[#ccff00]"
                  >
                    {item.phone}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-sm border border-[#1f1f1f] bg-[#0b0b0b] p-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">
              What to include
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-300">
              <li>
                Series/episode/chapter, character names, and source links.
              </li>
              <li>
                Context screenshots or timestamps for lore or corrections.
              </li>
              <li>Clear headline and 2–3 lines summarizing the pitch.</li>
              <li>
                Preferred credit name and any embargo or exclusivity notes.
              </li>
            </ul>
          </div>

          <div className="space-y-4 rounded-sm border border-[#1f1f1f] bg-[#0b0b0b] p-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">
              Response window
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">
              We typically reply within 24–48 hours on weekdays. Urgent
              corrections are prioritized.
            </p>
            <div className="mt-2 rounded-sm border border-[#2a2a2a] bg-[#0f0f0f] p-4 text-xs text-gray-400">
              For immediate takedowns or sensitive tips, mark the subject line
              with{" "}
              <span className="font-semibold text-[#ccff00]">
                [TIME-SENSITIVE]
              </span>
              .
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
