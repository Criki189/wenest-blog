/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/blog',
  assetPrefix: '/blog',
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Category URLs moved from /blog/category/<bucket> to /blog/<bucket>.
  // Permanent-redirect the old path so indexed links don't 404. basePath is
  // applied automatically, so these are relative to /blog.
  async redirects() {
    return [
      { source: '/category/:bucket', destination: '/:bucket', permanent: true },
    ];
  },
};

module.exports = nextConfig;
