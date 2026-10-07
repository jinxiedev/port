import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "print-adam-testimony-burlington.trycloudflare.com",
  ],
};

export default nextConfig;
