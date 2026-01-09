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
import { bungeeOutline } from "@/lib/font";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${bungeeOutline.variable} font-display antialiased bg-[#050505] text-[#f0f0f0]`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-N73PGN515J"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N73PGN515J');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
