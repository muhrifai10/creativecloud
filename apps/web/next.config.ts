import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexusdrive/core", "@nexusdrive/database"],
  serverExternalPackages: ["bullmq", "ioredis"],
  images: {
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1440, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: "/:path*.webp",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      // bullmq: peer opsional Valkey Glide + dynamic-require child processor
      { module: /bullmq[\\/]/ },
      { message: /valkey-glide/ },
    ];
    return config;
  },
};

export default nextConfig;