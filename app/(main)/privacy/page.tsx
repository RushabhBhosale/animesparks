import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/ad-slot";
import { defaultOgImage, siteName } from "@/utils/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the AnimeSparks privacy policy and understand how data is handled.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy",
    description:
      "Read the AnimeSparks privacy policy and understand how data is handled.",
    url: "/privacy",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description:
      "Read the AnimeSparks privacy policy and understand how data is handled.",
    images: [defaultOgImage],
  },
};

export default function PrivacyPage() {
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
              Privacy
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Clear, minimal data practices designed for readers first.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <section className="space-y-8 text-base leading-relaxed text-gray-700">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                Information We Collect
              </h2>
              <p className="mt-3">
                If you subscribe to updates, we store the email address you
                provide. Our servers may also log basic technical data such as
                IP address, user agent, and request timing for security and
                performance.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                How We Use Data
              </h2>
              <p className="mt-3">
                Data is used to deliver requested updates, maintain site
                reliability, and understand broad readership trends. We do not
                sell personal data.
              </p>
            </div>
          </div>

          <AdSlot variant="full" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                Cookies & Analytics
              </h2>
              <p className="mt-3">
                We may use lightweight analytics to understand page usage. If
                cookies are used, they are limited to essential functionality
                and basic measurement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                Your Choices
              </h2>
              <p className="mt-3">
                You can opt out of emails at any time using unsubscribe links.
                You may also contact us to request removal of your email from
                our records.
              </p>
            </div>
          </div>

          <AdSlot variant="full" />
        </section>
      </div>
    </main>
  );
}
