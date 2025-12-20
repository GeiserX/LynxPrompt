import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Optimize images from external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
