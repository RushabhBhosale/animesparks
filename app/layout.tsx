import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  defaultOgImage,
  getBaseUrl,
  siteDescription,
  siteName,
} from "@/utils/seo";
import Script from "next/script";
import { bungeeOutline, splineSans } from "@/lib/font";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = getBaseUrl();
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/favicon-48x48.png",
  },
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "anime blog",
    "anime reviews",
    "shonen analysis",
    "character breakdowns",
    "anime rankings",
    siteName,
  ],
  verification: {
    google: "tPu2ydEno2Cgozfk4C7IMvR9jnX8NgMyA2vFTRb7KdQ",
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: "/",
    siteName,
    type: "website",
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [defaultOgImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1425611919231559"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${bungeeOutline.variable} ${splineSans.variable} font-display antialiased bg-[#050505] text-[#f0f0f0]`}
      >
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
