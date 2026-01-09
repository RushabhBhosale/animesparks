import localFont from "next/font/local";
import { Spline_Sans } from "next/font/google";

export const bungeeOutline = localFont({
  src: "../public/fonts/Bungee_Outline/BungeeOutline-Regular.ttf",
  variable: "--font-bungee-outline",
  display: "swap",
});

export const splineSans = Spline_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spline-sans",
  display: "swap",
});
