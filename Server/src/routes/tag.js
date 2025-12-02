import express from "express";
import { tagController, tagValidators } from "../controllers/tagController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Routes pour la gestion des tags personnalisés
 * Toutes les routes nécessitent une authentification
 */

// GET /tag - Récupérer tous les tags de l'utilisateur (défaut + personnalisés)
router.get("/", requireAuth, tagController.getUserTags);

// POST /tag - Créer un nouveau tag personnalisé
router.post("/", requireAuth, tagValidators.create, tagController.createTag);

// PUT /tag/:id - Mettre à jour un tag personnalisé
router.put("/:id", requireAuth, tagValidators.update, tagController.updateTag);

// DELETE /tag/:id - Supprimer un tag personnalisé
router.delete("/:id", requireAuth, tagController.deleteTag);

export default router;
