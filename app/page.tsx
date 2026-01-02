import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anime Reviews News and Personal Picks",
  description:
    "Read honest anime reviews trending anime news and personal recommendations. Deep dives into popular series thoughtful opinions and must watch picks.",
  alternates: {
    canonical: "https://animesparks.blog/",
  },
  openGraph: {
    title: "Anime Reviews News and Personal Picks",
    description:
      "Honest anime reviews trending news and personal anime recommendations all in one place.",
    url: "https://animesparks.blog/",
    siteName: "AnimeSparks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Reviews News and Personal Picks",
    description:
      "Honest anime reviews trending news and personal anime recommendations.",
  },
};

const Main = () => {
  return redirect("/home");
};

export default Main;
