import { Router } from 'express';
import { DossierController } from '../controllers/DossierController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

//** Ce fichier permet de gérer les routes liées aux dossiers */

const router = Router();

// Route Get pour récupérer les dossiers (authentification requise)
router.get('/get', requireAuth, DossierController.getDossiers);

// Route Post pour créer un dossier (authentification requise)
router.post('/create', requireAuth, DossierController.createDossier);

// Route Get pour récupérer un dossier par son ID (authentification requise)
router.get('/get/:id', requireAuth, DossierController.getDossierById);

// Route Post pour mettre à jour un dossier par son ID (authentification requise)
router.post('/update/:id', requireAuth, DossierController.updateDossier);

// Route Post pour supprimer un dossier par son ID (authentification requise)
router.post('/delete/:id', requireAuth, DossierController.deleteDossier);

export default router;
