// sessionConfig.js
import session from 'express-session';

// URL du frontend pour la configuration CORS
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3001';

/**
 * Configuration des sessions Express
 * Gère l'authentification et la persistance des données utilisateur
 */
const sessionMiddleware = session({
  // Clé secrète pour signer les cookies de session (doit être unique en production)
  secret: process.env.SESSION_SECRET || 'super_secret_dev_key', 
  
  // Ne pas sauvegarder la session si elle n'a pas été modifiée
  resave: false,
  
  // Ne pas créer de session pour les requêtes non authentifiées
  saveUninitialized: false, 
  
  // Configuration des cookies de session
  cookie: {
    // HTTPS requis en production (false pour le développement local)
    secure: false, 
    
    // Empêche l'accès au cookie via JavaScript côté client (sécurité XSS)
    httpOnly: true,
    
    // Protection CSRF : 'lax' autorise les requêtes GET cross-site
    sameSite: 'lax',
    
    // Chemin d'application du cookie (toute l'application)
    path: '/',
    
    // Durée de vie : 1 heure (3600000 ms)
    maxAge: 3600000, 
  }
});

export default sessionMiddleware;