import { Router } from 'express';
import { DossierController } from '../controllers/DossierController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux dossiers */

const router = Router();

// Route Get pour récupérer les dossiers (authentification requise)
router.get('/get', requireAuth, DossierController.getFolders);

// Route Post pour créer un dossier (authentification requise)
router.post('/create', requireAuth, DossierController.createDossier);

// Route Get pour récupérer un dossier par son ID (authentification requise)
router.get('/get/:id', requireAuth, DossierController.getFolderById);

// Route Post pour mettre à jour un dossier par son ID (authentification requise)
router.post('/update/:id', requireAuth, DossierController.updateFolder);

// Route Post pour supprimer un dossier par son ID (authentification requise)
router.post('/delete/:id', requireAuth, DossierController.deleteDossier);

// Route Post pour ajouter une note à un dossier (authentification requise)
router.post('/add-note', requireAuth, DossierController.addNoteToFolder);

// Route Post pour retirer une note d'un dossier (authentification requise)
router.post('/remove-note', requireAuth, DossierController.removeNoteFromFolder);

// Route Get pour obtenir le dossier d'une note (authentification requise)
router.get('/note-folder/:noteId', requireAuth, DossierController.getNoteFolder);

// Route Get pour récupérer les notes d'un dossier (authentification requise)
router.get('/:folderId/notes', requireAuth, DossierController.getFolderNotes);

export default router;
