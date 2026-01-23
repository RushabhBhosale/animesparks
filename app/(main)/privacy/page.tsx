import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy | AnimeSparks",
  description:
    "Read AnimeSparks’ privacy policy explaining how data is handled, stored, and protected when you browse the website.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | AnimeSparks",
    description:
      "Read AnimeSparks’ privacy policy explaining how data is handled, stored, and protected when you browse the website.",
    url: "/privacy",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | AnimeSparks",
    description:
      "Read AnimeSparks’ privacy policy explaining how data is handled, stored, and protected when you browse the website.",
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
        </section>
      </div>
    </main>
  );
}
