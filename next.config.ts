import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling native/Node-only packages used in server actions
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
