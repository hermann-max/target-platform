import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel functions accept request bodies up to 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
  images: { unoptimized: true },
};

export default nextConfig;
