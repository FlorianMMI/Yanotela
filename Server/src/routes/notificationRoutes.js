import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';
import { requireAuth, requireNoteOwnership, requireWriteAccess } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux notes */

const router = Router();

// Route Get pour récupérer les notifications non acceptées (authentification requise)
router.get('/get', requireAuth, noteController.getNoteNotAccepted);

// Route Get pour récupérer une notification par son ID (vérification des permissions dans le contrôleur)
router.get('/get/:id', requireAuth, noteController.acceptInvitation);

// Route Post pour mettre à jour une note par son ID (vérification des droits d'écriture)
router.post('/update/:id', requireWriteAccess, noteController.updateNoteById);

export default router;
