import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { commentaireController } from '../controllers/commentaireController.js';

const router = Router();

// Créer un commentaire
router.post('/create', requireAuth, commentaireController.createcommentaire);

// Récupérer les commentaire d'une note
router.get('/get/:noteId', requireAuth, commentaireController.getcommentaireByNote);

export default router;
