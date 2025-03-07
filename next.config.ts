import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['imagedelivery.net', 'i.imgur.com','avatars.steamstatic.com','lh3.googleusercontent.com','openseauserdata.com'],
  },
};

export default nextConfig;
