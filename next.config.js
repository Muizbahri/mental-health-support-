/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  devIndicators: {
    autoPrerender: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://194.164.148.171:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 