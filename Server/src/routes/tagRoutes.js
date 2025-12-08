import { Router } from 'express';
import { getUserTags, createTag, updateTag, deleteTag } from '../controllers/tagController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(requireAuth);

// GET /tag/list - Récupérer tous les tags de l'utilisateur
router.get('/list', getUserTags);

// POST /tag/create - Créer un nouveau tag
router.post('/create', createTag);

// PUT /tag/:tagId - Mettre à jour un tag
router.put('/:tagId', updateTag);

// DELETE /tag/:tagId - Supprimer un tag
router.delete('/:tagId', deleteTag);

export default router;
