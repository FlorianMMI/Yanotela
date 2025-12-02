import { prisma } from "../config/database.js";
import { body, validationResult } from "express-validator";

/**
 * Contrôleur pour la gestion des tags personnalisés
 */
export const tagController = {
  /**
   * Récupérer tous les tags de l'utilisateur (défaut + personnalisés)
   * @route GET /tag
   */
  getUserTags: async (req, res) => {
    const { userId } = req.session;

    try {
      // Récupérer les tags personnalisés de l'utilisateur
      const customTags = await prisma.tag.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      // Tags par défaut (non modifiables)
      const defaultTags = [
        { id: "default-darkred", label: "Défault", color: "var(--primary)", isDefault: true },
        { id: "default-gold", label: "Or", color: "#D4AF37", isDefault: true },
        { id: "default-blue", label: "Bleu", color: "#3B82F6", isDefault: true },
        { id: "default-green", label: "Vert", color: "#10B981", isDefault: true },
        { id: "default-red", label: "Rouge", color: "#EF4444", isDefault: true },
        { id: "default-purple", label: "Violet", color: "#8B5CF6", isDefault: true },
        { id: "default-orange", label: "Orange", color: "#F97316", isDefault: true },
        { id: "default-pink", label: "Rose", color: "#EC4899", isDefault: true },
        { id: "default-gray", label: "Gris", color: "#9CA3AF", isDefault: true },
      ];

      // Combiner les tags par défaut et personnalisés
      const allTags = [...defaultTags, ...customTags];

      res.status(200).json({ tags: allTags });
    } catch (error) {
      console.error("[getUserTags] Erreur:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des tags",
        error: error.message,
      });
    }
  },

  /**
   * Créer un nouveau tag personnalisé
   * @route POST /tag
   * @validation label (String, 1-30 caractères), color (hex)
   */
  createTag: async (req, res) => {
    const { userId } = req.session;
    const { label, color } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validation couleur hex
    const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
    if (!hexColorRegex.test(color)) {
      return res.status(400).json({
        message: "La couleur doit être au format hexadécimal (#RRGGBB)",
      });
    }

    try {
      // Créer le tag
      const newTag = await prisma.tag.create({
        data: {
          label,
          color,
          userId,
          isDefault: false,
        },
      });

      res.status(201).json({
        message: "Tag créé avec succès",
        tag: newTag,
      });
    } catch (error) {
      console.error("[createTag] Erreur:", error);
      res.status(500).json({
        message: "Erreur lors de la création du tag",
        error: error.message,
      });
    }
  },

  /**
   * Mettre à jour un tag personnalisé
   * @route PUT /tag/:id
   * @validation label (String, 1-30 caractères), color (hex)
   */
  updateTag: async (req, res) => {
    const { userId } = req.session;
    const { id } = req.params;
    const { label, color } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validation couleur hex
    const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
    if (color && !hexColorRegex.test(color)) {
      return res.status(400).json({
        message: "La couleur doit être au format hexadécimal (#RRGGBB)",
      });
    }

    try {
      // Vérifier que le tag existe et appartient à l'utilisateur
      const existingTag = await prisma.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        return res.status(404).json({ message: "Tag non trouvé" });
      }

      if (existingTag.userId !== userId) {
        return res.status(403).json({
          message: "Vous n'avez pas les droits pour modifier ce tag",
        });
      }

      if (existingTag.isDefault) {
        return res.status(403).json({
          message: "Les tags par défaut ne peuvent pas être modifiés",
        });
      }

      // Mettre à jour le tag
      const updatedTag = await prisma.tag.update({
        where: { id },
        data: {
          ...(label && { label }),
          ...(color && { color }),
        },
      });

      res.status(200).json({
        message: "Tag mis à jour avec succès",
        tag: updatedTag,
      });
    } catch (error) {
      console.error("[updateTag] Erreur:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour du tag",
        error: error.message,
      });
    }
  },

  /**
   * Supprimer un tag personnalisé
   * @route DELETE /tag/:id
   */
  deleteTag: async (req, res) => {
    const { userId } = req.session;
    const { id } = req.params;

    try {
      // Vérifier que le tag existe et appartient à l'utilisateur
      const existingTag = await prisma.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        return res.status(404).json({ message: "Tag non trouvé" });
      }

      if (existingTag.userId !== userId) {
        return res.status(403).json({
          message: "Vous n'avez pas les droits pour supprimer ce tag",
        });
      }

      if (existingTag.isDefault) {
        return res.status(403).json({
          message: "Les tags par défaut ne peuvent pas être supprimés",
        });
      }

      // Supprimer le tag
      await prisma.tag.delete({
        where: { id },
      });

      res.status(200).json({
        message: "Tag supprimé avec succès",
      });
    } catch (error) {
      console.error("[deleteTag] Erreur:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression du tag",
        error: error.message,
      });
    }
  },
};

/**
 * Validateurs pour les routes de tags
 */
export const tagValidators = {
  create: [
    body("label")
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage("Le nom du tag doit contenir entre 1 et 30 caractères"),
    body("color")
      .trim()
      .notEmpty()
      .withMessage("La couleur du tag est requise"),
  ],
  update: [
    body("label")
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage("Le nom du tag doit contenir entre 1 et 30 caractères"),
    body("color")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("La couleur du tag ne peut pas être vide"),
  ],
};
