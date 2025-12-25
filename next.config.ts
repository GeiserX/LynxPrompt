import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Temporarily ignore TypeScript errors during build (stale .next types issue)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable standalone output for Docker production builds
  output: "standalone",

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
      {
        protocol: "https",
        hostname: "lynxprompt.com",
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Required for Sentry client instrumentation in App Router
    instrumentationHook: true,
  },

  // Security: Disable x-powered-by header
  poweredByHeader: false,

  // Security: Additional headers (backup for middleware)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
