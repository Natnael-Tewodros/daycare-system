import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin dev requests for Next.js internal assets from specified origins
  // This will be required in a future major version of Next.js
  // Add additional origins as needed for your LAN/dev setup
  allowedDevOrigins: [
    "http://172.20.75.122:3000",
    "http://localhost:3000",
  ],
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Turbopack configuration to resolve lockfile warning
  turbopack: {
    root: process.cwd(),
  },
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
