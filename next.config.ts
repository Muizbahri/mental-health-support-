import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://194.164.148.171:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
