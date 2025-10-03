import { validateGoogleConfig } from '../config/googleConfig.js';

/**
 * Middleware pour vérifier la configuration Google OAuth
 */
export const validateGoogleOAuth = (req, res, next) => {
  try {
    validateGoogleConfig();
    next();
  } catch (error) {
    console.error('Configuration Google OAuth invalide:', error.message);
    return res.status(500).render('index', { 
      error: 'Service Google temporairement indisponible' 
    });
  }
};

/**
 * Middleware pour s'assurer qu'un utilisateur est connecté
 */
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).render('index', { 
      error: 'Vous devez être connecté pour accéder à cette page' 
    });
  }
  next();
};

/**
 * Middleware pour s'assurer qu'un utilisateur n'est pas connecté
 */
export const requireGuest = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
};

/**
 * Middleware pour ajouter des informations utilisateur aux templates
 */
export const addUserToLocals = async (req, res, next) => {
  if (req.session.userId) {
    try {
      // Ici vous pourriez récupérer les informations utilisateur
      // depuis la base de données si nécessaire
      res.locals.user = {
        id: req.session.userId,
        pseudo: req.session.pseudo,
        isLoggedIn: true
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};

/**
 * Middleware pour gérer les erreurs OAuth
 */
export const handleOAuthErrors = (error, req, res, next) => {
  console.error('Erreur OAuth:', error);
  
  // Nettoyer la session OAuth en cas d'erreur
  delete req.session.oauthState;
  delete req.session.linkingAccount;
  
  // Déterminer le type d'erreur et répondre en conséquence
  if (error.message.includes('invalid_grant')) {
    return res.status(400).render('index', { 
      error: 'Code d\'autorisation expiré. Veuillez réessayer.' 
    });
  }
  
  if (error.message.includes('access_denied')) {
    return res.status(400).render('index', { 
      error: 'Accès refusé. Connexion Google annulée.' 
    });
  }
  
  // Erreur générique
  return res.status(500).render('index', { 
    error: 'Erreur lors de la connexion avec Google. Veuillez réessayer.' 
  });
};

/**
 * Middleware pour logger les tentatives d'authentification
 */
export const logAuthAttempts = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`Tentative d'authentification Google:`, {
    ip: ip,
    userAgent: userAgent,
    timestamp: new Date().toISOString(),
    path: req.path
  });
  
  next();
};