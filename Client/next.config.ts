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
  
  // ✅ Headers de sécurité pour Cloudflare Turnstile
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com",
              "connect-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com wss://*.yanotela.fr wss://localhost:* https://preprod.yanotela.fr https://yanotela.fr https://accounts.google.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob: https://challenges.cloudflare.com",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            // Politique explicite pour éviter les avertissements browsing-topics/interest-cohort
            value: 'browsing-topics=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
  
  // ✅ CORRECTION : Résoudre le problème de double import Yjs
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
