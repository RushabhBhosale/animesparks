import type { Metadata } from "next";

import NotFoundScreen from "./(main)/not-found";
import { siteName } from "@/utils/seo";

export const metadata: Metadata = {
  title: `Page Not Found | ${siteName}`,
  description:
    "This dossier is missing. Jump back to AnimeSparks to keep reading the intel that exists.",
};

export default function NotFound() {
  return <NotFoundScreen />;
}
