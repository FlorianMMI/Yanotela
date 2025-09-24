// sessionConfig.js
import session from 'express-session';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super_secret_dev_key', // À REMPLACER ABSOLUMENT EN PROD
  resave: false, // Ne pas sauvegarder la session si elle n'a pas été modifiée
  saveUninitialized: false, // Ne pas sauvegarder les sessions non initialisées
  cookie: {
    secure: false, // false en développement (HTTP)
    httpOnly: true, // Empêche l'accès au cookie via JavaScript côté client
    sameSite: 'lax',
    path: '/',
    maxAge: 3600000, // 1 heure en millisecondes
  }
});

export default sessionMiddleware;