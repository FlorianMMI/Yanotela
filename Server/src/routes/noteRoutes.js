import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';

const router = Router();


// Route Get pour récupérer les notes
router.get('/get', noteController.getNotes);

// Route Post pour créer une note
router.post('/create', noteController.createNote);

export default router;
