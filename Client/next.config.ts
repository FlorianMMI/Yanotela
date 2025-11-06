import type { NextConfig } from "next";

// @ts-ignore - next-pwa n'a pas de types officiels
import withPWA from "next-pwa";

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

// Configuration PWA pour le mode offline
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/yanotela\.fr\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5 // 5 minutes pour les API
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours pour les assets statiques
        }
      }
    },
    {
      urlPattern: /\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours pour les images
        }
      }
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offline-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours pour le reste
        }
      }
    }
  ]
});

export default pwaConfig(nextConfig);
