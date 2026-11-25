import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Shared Zod schemas ship as TypeScript source.
  transpilePackages: ["@repo/contracts"],
  // Let phones on the local network load dev assets (HMR, client JS).
  allowedDevOrigins: ["10.213.18.53", "*.local"],
  // Same origin for the browser: /api/* (including Better Auth at /api/auth) goes to Express.
  async rewrites() {
    const api = process.env.API_ORIGIN ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
