// sessionConfig.js
import session from 'express-session';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

/**
 * Configuration des sessions Express
 * Gère l'authentification et la persistance des données utilisateur
 */
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super_secret_dev_key', // À REMPLACER ABSOLUMENT EN PROD
  resave: false, // Ne pas sauvegarder la session si elle n'a pas été modifiée
  saveUninitialized: false, // Ne pas sauvegarder les sessions non initialisées
  cookie: {
    secure: true, // false en développement (HTTP)
    httpOnly: true, // Empêche l'accès au cookie via JavaScript côté client
    sameSite: 'lax',
    domain: '.yanotela.fr', // Domaine pour lequel le cookie est valide
    // Chemin d'application du cookie (toute l'application)
    path: '/',
    maxAge:1000 * 60 * 60 * 24 * 365 * 10, // 10 ans en ms
  }
});

export default sessionMiddleware;