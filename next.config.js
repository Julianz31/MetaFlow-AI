/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/generate-image': ['./lib/fonts/**/*'],
    },
  },
};

module.exports = nextConfig;
