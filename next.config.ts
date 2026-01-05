import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.sanity.io"],
    qualities: [60, 75],
  },
};

export default nextConfig;
