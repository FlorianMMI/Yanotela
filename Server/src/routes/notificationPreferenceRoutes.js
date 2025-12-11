import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import notificationPreferenceController from '../controllers/notificationPreferenceController.js';

/**
 * Routes pour la gestion des préférences de notifications
 */

const router = Router();

// Route GET pour récupérer les préférences de l'utilisateur connecté
router.get('/get', requireAuth, notificationPreferenceController.getPreferences);

// Route PUT pour mettre à jour les préférences
router.put('/update', requireAuth, notificationPreferenceController.updatePreferences);

export default router;
