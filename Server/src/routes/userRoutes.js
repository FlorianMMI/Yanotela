import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Route Get pour récupérer les informations de l'utilisateur (authentification requise)
router.get('/info', requireAuth, userController.getUserInfo);

// Route DELETE pour demander la suppression du compte (authentification requise)
router.delete('/delete', requireAuth, userController.requestAccountDeletion);

// Route POST pour annuler la suppression du compte (authentification requise)
router.post('/cancel-deletion', requireAuth, userController.cancelAccountDeletion);

// Route POST pour supprimer définitivement les comptes expirés (pour cron job)
router.post('/delete-expired', userController.deleteExpiredAccounts);

// 
router.post('/update', requireAuth, userController.updateUserInfo);

export default router;

