/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/blog',
  assetPrefix: '/blog',
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
