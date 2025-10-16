// sessionConfig.js
import session from 'express-session';

const FRONT_URL = process.env.FRONT_URL || 'https://yanotela.fr';

/**
 * Configuration des sessions Express
 * Gère l'authentification et la persistance des données utilisateur
 */
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super_secret_dev_key', // À REMPLACER ABSOLUMENT EN PROD
  resave: false, // Ne pas sauvegarder la session si elle n'a pas été modifiée
  saveUninitialized: false, // Ne pas sauvegarder les sessions non initialisées
  cookie: {
    secure: true, // HTTPS obligatoire en production
    httpOnly: true, // Empêche l'accès au cookie via JavaScript côté client
    sameSite: 'lax', // Permet les redirections OAuth
    domain: 'yanotela.fr', // Partage le cookie entre front et API (pas de point pour le domaine principal)
    path: '/', // Cookie valide pour toute l'application
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 ans en ms
  }
});

export default sessionMiddleware;