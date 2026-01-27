import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { PageHero } from "@/components/page-hero";

const metaTitle = "Privacy Policy";
const metaDescription =
  "Read AnimeSparks’ privacy policy explaining how data is handled, stored, and protected when you browse the website.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/privacy",
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0]">
      <PageHero
        eyebrow="Privacy"
        title="Privacy Policy"
        description="Clear, minimal data practices designed for readers first."
        backgroundImage="/anime-poster.jpg"
      />

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <section className="space-y-8 text-base leading-relaxed text-gray-300">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
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
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                How We Use Data
              </h2>
              <p className="mt-3">
                Data is used to deliver requested updates, maintain site
                reliability, and understand broad readership trends. We do not
                sell personal data.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Cookies & Analytics
              </h2>
              <p className="mt-3">
                We may use lightweight analytics to understand page usage. If
                cookies are used, they are limited to essential functionality
                and basic measurement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Your Choices
              </h2>
              <p className="mt-3">
                You can opt out of emails at any time using unsubscribe links.
                You may also contact us to request removal of your email from
                our records.
              </p>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Advertising Cookies (Google AdSense)
              </h2>
              <p className="mt-3">
                Third-party vendors, including Google, may use cookies to serve
                ads based on a user’s prior visits to this website or other
                websites. Google’s use of advertising cookies enables it and its
                partners to serve ads based on your visit to AnimeSparks and/or
                other sites on the internet. Users may opt out of personalized
                advertising by visiting Google’s Ads Settings.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
