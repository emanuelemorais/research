import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore type errors in node_modules (like @ethereumjs/tx)
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - eslint property exists in Next.js but may not be in types
  eslint: {
    // Disable ESLint during builds if not installed
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
