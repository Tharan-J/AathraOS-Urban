import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow large video file uploads to the junction API (up to 200MB per feed)
    middlewareClientMaxBodySize: 200 * 1024 * 1024,
  },
  async rewrites() {
    return [
      {
        // Proxy calls to the junction backend via /api/junction/* 
        // Set NEXT_PUBLIC_JUNCTION_API to your HuggingFace Space URL in production
        source: "/api/junction/:path*",
        destination: `${process.env.JUNCTION_API_URL || "http://localhost:8001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
