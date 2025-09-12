const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Configurações experimentais removidas
  },
  webpack: (config, { isServer }) => {
    // Configuração mais segura para fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        process: require.resolve('process/browser'),
        crypto: require.resolve('crypto-browserify'),
        buffer: require.resolve('buffer'),
        canvas: false, // Desabilitar canvas no cliente
      };
      
      // Ignorar canvas completamente no cliente
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);