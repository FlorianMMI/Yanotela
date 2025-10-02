import express from 'express';
import { FetchPermission, UpdatePermission, AddPermission } from '../controllers/permissionController.js';

const router = express.Router();

// Route RESTful pour récupérer les permissions d'une note
router.get('/note/:noteId', FetchPermission);
// Route pour modifier le rôle d'un utilisateur sur une note spécifique
router.put('/update/:noteId/:userId', UpdatePermission);
// Route pour ajouter un utilisateur à une note par email/pseudo
router.post('/add/:noteId', AddPermission);

export default router;
