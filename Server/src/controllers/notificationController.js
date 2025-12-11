import { PrismaClient } from "@prisma/client";
import { notifyCommentAdded } from "../services/yjsNotificationService.js";

const prisma = new PrismaClient();

export const notificationController = {
  /**
   * Notifie les collaborateurs qu'un commentaire a été ajouté
   * @route POST /notification/comment/:noteId
   */
  notifyComment: async (req, res) => {
    const { noteId } = req.params;
    const { commentPreview } = req.body;
    const { userId, pseudo } = req.session;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    try {
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { Titre: true, isPublic: true }
      });

      if (!note) {
        return res.status(404).json({ error: "Note non trouvée" });
      }

      // Envoyer la notification via le service YJS
      await notifyCommentAdded(
        noteId,
        note.Titre,
        pseudo || "Utilisateur",
        userId,
        commentPreview || "Nouveau commentaire",
        note.isPublic
      );

      res.json({ success: true });
    } catch (error) {
      console.error("[notificationController] Erreur notifyComment:", error);
      res.status(500).json({ error: "Erreur serveur lors de l'envoi de la notification" });
    }
  }
};
