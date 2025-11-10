import type { NextConfig } from "next";

export const BACKEND_INTERNAL_URL = ["development", "test"].includes(
    process.env.NODE_ENV ?? "",
)
    ? "http://localhost:4000"
    : "http://Planify-back:4000";

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
