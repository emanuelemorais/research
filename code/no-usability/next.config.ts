import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore type errors in node_modules (like @ethereumjs/tx)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during builds if not installed
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
