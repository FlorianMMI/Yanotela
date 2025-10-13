import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';
import { requireAuth, requireNoteOwnership, requireWriteAccess } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux notes */

const router = Router();

// Route Get pour récupérer les notifications non acceptées (authentification requise)
router.get('/get', requireAuth, noteController.getNoteNotAccepted);

// Route Get pour récupérer une notification par son ID (vérification des permissions dans le contrôleur)
router.get('/get/:id', requireAuth, noteController.acceptInvitation);

// Route Post pour accepter une invitation (authentification requise)
router.post('/accept/:id', requireAuth, noteController.acceptInvitation);

// Route Post pour refuser une invitation (authentification requise)
router.post('/refuse/:id', requireAuth, noteController.deleteInvitation);

export default router;
