import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Advertise",
  description:
    "Advertise on AnimeSparks. Limited slots, direct audience, 99rs per month.",
  alternates: {
    canonical: "/advertise",
  },
  openGraph: {
    title: "Advertise",
    description:
      "Advertise on AnimeSparks. Limited slots, direct audience, 99rs per month.",
    url: "/advertise",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Advertise",
    description:
      "Advertise on AnimeSparks. Limited slots, direct audience, 99rs per month.",
    images: [defaultOgImage],
  },
};

export default function AdvertisePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Advertise"
        title="Advertise on AnimeSparks"
        description="Limited placements for brands that want a focused anime audience."
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <section className="grid grid-cols-1 gap-8 text-base leading-relaxed text-gray-300 md:grid-cols-2 lg:grid-cols-1">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Pricing
            </h2>
            <p className="mt-3 text-lg text-gray-200">
              Promote your brand here for just 99rs per month.
            </p>
          </div>

          <div className="rounded-sm border border-[#1f1f1f] bg-[#0b0b0b] p-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Contact
            </h3>
            <p className="mt-3 text-sm text-gray-400">
              Reach out directly for availability and placements.
            </p>
            <div className="mt-4 space-y-2 text-sm font-semibold text-gray-200">
              <a
                href="tel:+919137996317"
                className="block transition-colors md:hover:text-[#ccff00]"
              >
                +91 9137996317
              </a>
              <a
                href="mailto:rushabhbhosale25757@gmail.com"
                className="block transition-colors md:hover:text-[#ccff00]"
              >
                rushabhbhosale25757@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
