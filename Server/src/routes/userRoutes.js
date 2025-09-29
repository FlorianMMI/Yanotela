import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Route Get pour récupérer les informations de l'utilisateur (authentification requise)
router.get('/info', requireAuth, userController.getUserInfo);

export default router;

