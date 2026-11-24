import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Let phones on the local network load dev assets (HMR, client JS).
  allowedDevOrigins: ["10.213.18.53", "*.local"],
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
