import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL =
  process.env.DOCKERIZED === "1"
    ? "http://Planify-back:4000"
    : "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
