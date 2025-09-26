import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';
import { requireAuth, requireNoteOwnership } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux notes */

const router = Router();

// Route Get pour récupérer les notes (authentification requise)
router.get('/get', requireAuth, noteController.getNotes);

// Route Post pour créer une note (authentification requise)
router.post('/create', requireAuth, noteController.createNote);

// Route Get pour récupérer une note par son ID (vérification de propriété)
router.get('/get/:id', requireNoteOwnership, noteController.getNoteById);

// Route Post pour mettre à jour une note par son ID (vérification de propriété)
router.post('/update/:id', requireNoteOwnership, noteController.updateNoteById);

export default router;
