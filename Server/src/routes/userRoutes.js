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

// Route POST pour mettre à jour les informations utilisateur (authentification requise)
router.post('/update', requireAuth, userController.updateUserInfo);

// Route PATCH pour mettre à jour le thème de l'utilisateur (authentification requise)
router.patch('/theme', requireAuth, userController.updateUserTheme);

// Route post pour mettre en place le code 2FA (authentification requise) sur redis 
router.post('/2fa/setup', requireAuth, userController.setup2FA);

router.post('/2fa/verify', requireAuth, userController.check2fa);

// Route GET pour récupérer les préférences de notification
router.get('/notifications/preferences', requireAuth, userController.getNotificationPreferences);

// Route PUT pour mettre à jour les préférences de notification
router.put('/notifications/preferences', requireAuth, userController.updateNotificationPreferences);

export default router;
