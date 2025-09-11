/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['canvas'],
  },
  webpack: (config, { isServer }) => {
    // Configuração para suportar arquivos PDF
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      process: false,
    };

    // Configuração específica para canvas no servidor
    if (isServer) {
      config.externals.push('canvas');
    }

    return config;
  },
};

module.exports = nextConfig;