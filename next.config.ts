import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const internalBackendUrl = process.env.BACKEND_INTERNAL_URL ?? backendUrl;

    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${internalBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
