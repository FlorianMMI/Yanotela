import { Router } from 'express';
import { noteController } from '../controllers/noteController.js';

const router = Router();

// Route GET pour tester (accessible via navigateur)
router.post('/create', noteController.createNote);



export default router;
