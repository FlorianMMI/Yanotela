/**
 * Routes pour la synchronisation automatique des permissions via YJS Awareness
 */

import { Router } from 'express';
import { awarenessController } from '../controllers/awarenessController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Auto-accepter une permission quand un utilisateur rejoint une note
router.post('/auto-accept/:noteId', requireAuth, awarenessController.autoAcceptPermission);

export default router;
