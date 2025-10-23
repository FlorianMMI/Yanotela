import { Router } from 'express';
import { FolderController } from '../controllers/FolderController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux dossiers */

const router = Router();

// Route Get pour récupérer les dossiers (authentification requise)
router.get('/get', requireAuth, FolderController.getFolders);

// Route Post pour créer un dossier (authentification requise)
router.post('/create', requireAuth, FolderController.createFolder);

// Route Get pour récupérer un dossier par son ID (authentification requise)
router.get('/get/:id', requireAuth, FolderController.getFolderById);

// Route Post pour mettre à jour un dossier par son ID (authentification requise)
router.post('/update/:id', requireAuth, FolderController.updateFolder);

// Route Post pour supprimer un dossier par son ID (authentification requise)
router.post('/delete/:id', requireAuth, FolderController.deleteFolder);

export default router;
