/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // En local el proyecto vive en ~/Documents (sincronizado con iCloud). iCloud
  // "evacúa" archivos de .next mientras Next los escribe y rompe el dev server.
  // Sufijo .nosync => iCloud ignora la carpeta. En Vercel se usa .next normal.
  distDir: process.env.VERCEL ? '.next' : '.next.nosync',
  // Chromium (serverless) y playwright-core no deben empaquetarse por webpack:
  // deben cargarse como módulos externos para que el binario nativo funcione en Vercel.
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'playwright-core', 'sharp'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // sharp: nativo — si webpack lo empaqueta no encuentra su binario .node
      // (con node_modules symlinkeado a .nosync deja de detectarse como externo).
      config.externals.push('@sparticuz/chromium', 'playwright-core', 'sharp');
    }
    return config;
  },
};

module.exports = nextConfig;
