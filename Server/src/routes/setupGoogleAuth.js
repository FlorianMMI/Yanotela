import googleAuthRoutes from './googleAuthRoutes.js';
import { validateGoogleOAuth, addUserToLocals } from '../middlewares/googleAuthMiddleware.js';

/**
 * Intègre les routes Google Auth dans l'application Express
 */
export function setupGoogleAuth(app) {
  // Middleware global pour ajouter les informations utilisateur aux vues
  app.use(addUserToLocals);
  
  // Middleware de validation Google OAuth (optionnel - seulement si vous voulez valider au démarrage)
  // app.use('/auth/google*', validateGoogleOAuth);
  
  // Routes Google OAuth
  app.use('/auth', googleAuthRoutes);
  
  console.log('✅ Routes Google OAuth configurées');
  console.log('   - GET  /auth/google (Initier connexion)');
  console.log('   - GET  /auth/google/callback (Callback)');
  console.log('   - POST /auth/google/logout (Déconnexion)');
  console.log('   - GET  /auth/google/link (Lier compte)');
}

export default setupGoogleAuth;