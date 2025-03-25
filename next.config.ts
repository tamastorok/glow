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
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.useglow.xyz',
          },
        ],
        destination: 'https://useglow.xyz/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
