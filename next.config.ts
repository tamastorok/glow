import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['imagedelivery.net', 'i.imgur.com','avatars.steamstatic.com','lh3.googleusercontent.com','openseauserdata.com'],
  },
  async headers() {
    return [
      {
        source: '/.well-known/farcaster/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/frames/compliment',
      },
    ];
  },
};

export default nextConfig;
