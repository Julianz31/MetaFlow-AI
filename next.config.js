/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Chromium (serverless) y playwright-core no deben empaquetarse por webpack:
  // deben cargarse como módulos externos para que el binario nativo funcione en Vercel.
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@sparticuz/chromium', 'playwright-core');
    }
    return config;
  },
};

module.exports = nextConfig;
