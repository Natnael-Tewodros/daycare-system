import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin dev requests for Next.js internal assets from specified origins
  // This will be required in a future major version of Next.js
  // Add additional origins as needed for your LAN/dev setup
  allowedDevOrigins: [
    "http://172.20.75.122:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
