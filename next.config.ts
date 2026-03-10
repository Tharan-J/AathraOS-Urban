import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
