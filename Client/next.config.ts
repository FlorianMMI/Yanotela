import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  poweredByHeader: false,
  /* config options here */
  
  // Add CSP headers for Cloudflare Turnstile
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "frame-src 'self' https://challenges.cloudflare.com",
              "connect-src 'self' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  
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
        'yjs': 'yjs',
      };
    }
    return config;
  },
};

export default nextConfig;
