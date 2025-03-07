import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['imagedelivery.net', 'i.imgur.com'],
  },
};

export default nextConfig;
