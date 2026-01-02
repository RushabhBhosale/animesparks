import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";

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
    <main className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-linear-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/anime-poster.jpg")',
            }}
          ></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/90">
              Advertise
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Advertise on AnimeSparks
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Limited placements for brands that want a focused anime audience.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <section className="space-y-8 text-base leading-relaxed text-gray-700">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Pricing
            </h2>
            <p className="mt-3 text-lg">
              Promote your brand here for just 99rs per month.
            </p>
          </div>

          <div className="rounded-sm border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
              Contact
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Reach out directly for availability and placements.
            </p>
            <div className="mt-4 space-y-2 text-sm font-semibold text-gray-700">
              <a
                href="tel:+919137996317"
                className="block transition-colors hover:text-red-600"
              >
                +91 9137996317
              </a>
              <a
                href="mailto:rushabhbhosale25757@gmail.com"
                className="block transition-colors hover:text-red-600"
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
