/**
 * Configuration Google OAuth2
 */

export const googleConfig = {
  // Identifiants OAuth2 (à définir dans les variables d'environnement)
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  
  // Scopes requis pour l'authentification
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
  
  // Options OAuth2
  options: {
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true
  },
  
  // URLs Google OAuth2
  urls: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
    revoke: 'https://oauth2.googleapis.com/revoke'
  }
};

/**
 * Valide la configuration Google
 */
export function validateGoogleConfig() {
  const missingVars = [];
  
  if (!googleConfig.clientId) {
    missingVars.push('GOOGLE_CLIENT_ID');
  }
  
  if (!googleConfig.clientSecret) {
    missingVars.push('GOOGLE_CLIENT_SECRET');
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes pour Google OAuth: ${missingVars.join(', ')}\n` +
      'Veuillez les définir dans votre fichier .env ou dans vos variables d\'environnement.'
    );
  }
  
  return true;
}

/**
 * Configuration pour les différents environnements
 */
export const environmentConfig = {
  development: {
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    baseUrl: process.env.FRONT_URL
  },
  production: {
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    baseUrl: process.env.FRONT_URL
  },
  test: {
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    baseUrl: process.env.FRONT_URL
  }
};

/**
 * Obtient la configuration pour l'environnement actuel
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfig[env] || environmentConfig.development;
}