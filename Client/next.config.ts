import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  poweredByHeader: false,
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  // Configuration pour préprod - ignore les erreurs de linting/TypeScript temporairement
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker optimization
  output: 'standalone',
  
  webpack: (config, { isServer }) => {
    // Éviter les imports dupliqués de Yjs
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'yjs': 'yjs',
      };
    }
    return config;
  },
};

export default nextConfig;
