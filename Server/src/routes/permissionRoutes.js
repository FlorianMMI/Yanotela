import express from 'express';
import { FetchPermission, UpdatePermission, AddPermission, RemovePermission } from '../controllers/permissionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route RESTful pour récupérer les permissions d'une note
router.get('/note/:noteId', requireAuth, FetchPermission);
// Route pour modifier le rôle d'un utilisateur sur une note spécifique
router.put('/update/:noteId/:userId', requireAuth, UpdatePermission);
// Route pour ajouter un utilisateur à une note par email/pseudo
router.post('/add/:noteId', requireAuth, AddPermission);

// Route pour retirer un utilisateur d'une note (sauf propriétaire)
router.delete('/:noteId/:userId', requireAuth, RemovePermission);

export default router;
