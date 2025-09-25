import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';

//** Ce fichier permet de gérer les routes liées aux notes */


const router = Router();


// Route Get pour récupérer les notes
router.get('/get', noteController.getNotes);

// Route Post pour créer une note
router.post('/create', noteController.createNote);

// Route Get pour récupérer une note par son ID
router.get('/get/:id', noteController.getNoteById);

// Route Post pour mettre à jour une note par son ID
router.post('/update/:id', noteController.updateNoteById);


export default router;
