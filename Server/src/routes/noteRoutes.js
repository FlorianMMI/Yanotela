import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';
import { requireAuth, requireNoteOwnership, requireWriteAccess } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux notes */

const router = Router();

// Route Get pour récupérer les notes (authentification requise)
router.get('/get', requireAuth, noteController.getNotes);

// Route Post pour créer une note (authentification requise)
router.post('/create', requireAuth, noteController.createNote);

// Route Post pour dupliquer une note (authentification requise)
router.post('/duplicate/:id', requireAuth, noteController.duplicateNote);

// Route Get pour récupérer une note par son ID (vérification des permissions dans le contrôleur)
router.get('/get/:id', requireAuth, noteController.getNoteById);

// Route Post pour mettre à jour une note par son ID (vérification des droits d'écriture)
router.post('/update/:id', requireWriteAccess, noteController.updateNoteById);

// Route Post pour synchroniser YJS state et Content (collaboration temps réel)
router.post('/sync/:id', requireWriteAccess, noteController.syncNoteState);

// Route Post pour supprimer une note par son ID (soft delete, vérification dans le contrôleur)
router.post('/delete/:id', requireAuth, noteController.deleteNote);

// Route Post pour quitter une note partagée (supprime la permission de l'utilisateur)
router.post('/leave/:id', requireAuth, noteController.leaveNote);

// Route Get pour récupérer les notes supprimées (corbeille)
router.get('/deleted', requireAuth, noteController.getDeletedNotes);

// Route Post pour restaurer une note supprimée
router.post('/restore/:id', requireAuth, noteController.restoreNote);

// Route Post pour assigner une note à un dossier
router.post('/assign-folder/:id', requireAuth, noteController.assignFolder);

// Route Post pour retirer une note d'un dossier
router.post('/remove-folder/:id', requireAuth, noteController.removeFolder);

// Route Get pour récupérer le dossier d'une note
router.get('/folder/:id', requireAuth, noteController.getNoteFolder);

export default router;
