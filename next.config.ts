import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const internalBackendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://lms-backend:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${internalBackendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${internalBackendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
