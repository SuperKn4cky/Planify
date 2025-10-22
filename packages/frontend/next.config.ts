import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  async rewrites() {
    if (!process.env.BACKEND_URL) throw new Error('BACKEND_URL missing');
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
