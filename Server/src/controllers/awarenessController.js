/**
 * Contrôleur pour la synchronisation automatique des permissions via YJS Awareness
 * 
 * Ce contrôleur gère l'auto-acceptation des permissions quand un utilisateur
 * rejoint une note en temps réel (détecté via YJS awareness).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const awarenessController = {
  /**
   * Auto-accepte une permission quand un utilisateur rejoint une note
   * Appelé automatiquement par le client quand l'awareness détecte la présence
   * 
   * @route POST /awareness/auto-accept/:noteId
   * @access Private (authentification requise)
   */
  autoAcceptPermission: async (req, res) => {
    const { noteId } = req.params;
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non authentifié" 
      });
    }

    try {
      // Vérifier si l'utilisateur a une permission non acceptée pour cette note
      const permission = await prisma.permission.findFirst({
        where: {
          noteId: noteId,
          userId: parseInt(userId),
          isAccepted: false,
        },
      });

      // Si aucune permission non acceptée, ne rien faire (c'est normal)
      if (!permission) {
        return res.status(200).json({ 
          success: true,
          autoAccepted: false,
          message: "Aucune permission en attente" 
        });
      }

      // Auto-accepter la permission
      await prisma.permission.update({
        where: {
          noteId_userId: {
            noteId: noteId,
            userId: parseInt(userId),
          },
        },
        data: {
          isAccepted: true,
        },
      });

      // Récupérer les infos de la note pour le message de succès
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { Titre: true },
      });

      return res.status(200).json({
        success: true,
        autoAccepted: true,
        message: `Permission auto-acceptée pour "${note?.Titre || 'la note'}"`,
        noteId: noteId,
      });

    } catch (error) {
      console.error("[autoAcceptPermission] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'auto-acceptation de la permission",
        error: error.message,
      });
    }
  },
};
