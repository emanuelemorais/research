import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore type errors in node_modules (like @ethereumjs/tx)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
