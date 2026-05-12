/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/generate-image': ['./lib/fonts/*.woff', './lib/fonts/*.woff2'],
    },
  },
};

module.exports = nextConfig;
