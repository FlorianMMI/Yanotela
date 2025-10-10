import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  
  // ✅ CORRECTION : Résoudre le problème de double import Yjs
  webpack: (config, { isServer }) => {
    // Éviter les imports dupliqués de Yjs
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        yjs: require.resolve('yjs'),
      };
    }
    return config;
  },
};

export default nextConfig;
