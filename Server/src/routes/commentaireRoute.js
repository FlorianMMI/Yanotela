import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { CommentaireController } from '../controllers/CommentaireController.js';

const router = Router();

// Créer un commentaire
router.post('/create', requireAuth, CommentaireController.createCommentaire);

// Récupérer les commentaires d'une note
router.get('/get/:noteId', requireAuth, CommentaireController.getCommentairesByNote);

export default router;
