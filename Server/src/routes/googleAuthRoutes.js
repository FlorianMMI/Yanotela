import express from 'express';
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  googleLogout,
  linkGoogleAccount
} from '../controllers/googleAuthController.js';

const router = express.Router();

/**
 * Route pour initier l'authentification Google
 * GET /auth/google
 */
router.get('/google', initiateGoogleAuth);

/**
 * Route de callback pour Google OAuth
 * GET /auth/google/callback
 */
router.get('/google/callback', handleGoogleCallback);

/**
 * Route pour déconnecter un utilisateur Google
 * POST /auth/google/logout
 */
router.post('/google/logout', googleLogout);

/**
 * Route pour lier un compte Google à un compte existant
 * GET /auth/google/link
 */
router.get('/google/link', linkGoogleAccount);

/**
 * Route pour délier un compte Google (optionnel)
 * POST /auth/google/unlink
 */
router.post('/google/unlink', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    // Ici vous pourriez ajouter une logique pour supprimer
    // les informations Google liées au compte
    // Par exemple, supprimer un champ google_id de la base de données
    
    res.json({ success: true, message: 'Compte Google délié avec succès' });
  } catch (error) {
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;