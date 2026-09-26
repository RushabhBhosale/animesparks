import type { Metadata } from "next";

import NotFoundScreen from "./(main)/not-found";
import { siteName } from "@/utils/seo";

export const metadata: Metadata = {
  title: `Page Not Found | ${siteName}`,
  description:
    "This page could not be found. Explore AnimeSparks for the latest anime reviews, news, and analysis.",
};

export default function NotFound() {
  return <NotFoundScreen />;
}
