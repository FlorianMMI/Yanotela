import { PrismaClient } from "@prisma/client";
import { sendNoteInvitationEmail } from "../services/emailService.js";
import {
  notifyRoleChanged,
  notifyUserRemoved,
  notifyInvitation,
  notifySomeoneInvited,
  notifyCollaboratorRemoved,
} from "../services/yjsNotificationService.js";
const prisma = new PrismaClient();

//     {id: 1, role: 0}, // Propriétaire
//     {id: 2, role: 1}, // Administrateur
//     {id: 3, role: 2}, // Editeur
//     {id: 4, role: 3} // Lecteur

const getPermission = async (userId, noteId) => {
  try {
    const permission = await prisma.permission.findFirst({
      where: {
        userId: userId,
        noteId: noteId,
      },
    });
    return permission;
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    throw new Error("Erreur lors de la récupération des permissions");
  }
};

export async function FetchPermission(req, res) {
  const { noteId } = req.params;
  try {
    const permissions = await prisma.permission.findMany({
      where: {
        noteId: noteId,
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            email: true,
          },
        },
      },
    });
    res.json({ permissions });
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des permissions" });
  }
}

// Handler Express pour changer le rôle d'un utilisateur sur une note spécifique
const UpdatePermission = async (req, res) => {
  const { noteId, userId } = req.params;
  const connected = req.session.userId;
  if (!connected) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  try {
    // Récupère la permission du user connecté sur cette note
    const adminPermission = await prisma.permission.findFirst({
      where: {
        userId: connected,
        noteId: noteId,
      },
    });
    if (!adminPermission) {
      return res
        .status(403)
        .json({ error: "Vous n'avez pas de permission sur cette note" });
    }

    // Récupère la permission de l'utilisateur cible sur cette note
    const userPermission = await prisma.permission.findFirst({
      where: {
        userId: parseInt(userId),
        noteId: noteId,
      },
    });
    if (!userPermission) {
      return res
        .status(404)
        .json({ error: "Utilisateur cible non trouvé sur cette note" });
    }

    if (adminPermission.role < userPermission.role) {
      const { newRole } = req.body;
      if (
        typeof newRole !== "number" ||
        newRole <= adminPermission.role ||
        newRole > 3
      ) {
        return res
          .status(400)
          .json({ error: "Rôle cible invalide ou non autorisé." });
      }
      const oldRole = userPermission.role;

      await prisma.permission.update({
        where: {
          noteId_userId: {
            noteId: noteId,
            userId: parseInt(userId),
          },
        },
        data: { role: newRole },
      });

      // Notifier l'utilisateur du changement de rôle via YJS
      try {
        console.log(`🔔 [UpdatePermission] Préparation notification changement rôle pour userId=${userId}, noteId=${noteId}`);
        const note = await prisma.note.findUnique({
          where: { id: noteId },
          select: { Titre: true },
        });
        const actor = await prisma.user.findUnique({
          where: { id: connected },
          select: { pseudo: true },
        });
        console.log(`🔔 [UpdatePermission] Appel notifyRoleChanged: userId=${parseInt(userId)}, note="${note?.Titre || "Sans titre"}", oldRole=${oldRole}, newRole=${newRole}, actor=${actor?.pseudo || "Un administrateur"}`);
        await notifyRoleChanged(
          parseInt(userId),
          noteId,
          note?.Titre || "Sans titre",
          oldRole,
          newRole,
          actor?.pseudo || "Un administrateur"
        );
        console.log(`✅ [UpdatePermission] Notification changement rôle envoyée avec succès`);
      } catch (notifError) {
        console.error("❌ [UpdatePermission] Erreur notification:", notifError);
        // Ne pas bloquer la réponse si la notification échoue
      }

      return res.json({ success: true, message: `Rôle modifié avec succès` });
    } else {
      return res.status(403).json({
        error:
          "Vous ne pouvez modifier que les utilisateurs ayant un rôle inférieur au vôtre.",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des permissions:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour des permissions" });
  }
};

// Handler Express pour ajouter un utilisateur à une note par email/pseudo
async function AddPermission(req, res) {
  const { noteId } = req.params;
  const { identifier, role } = req.body; // identifier = email ou pseudo
  const connected = req.session.userId;

  if (!connected) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  try {
    // Vérifier les permissions de l'utilisateur connecté sur cette note
    const adminPermission = await prisma.permission.findFirst({
      where: {
        userId: connected,
        noteId: noteId,
      },
    });
    if (!adminPermission || adminPermission.role > 1) {
      // Seuls propriétaire et admin peuvent ajouter
      return res.status(403).json({
        error: "Permissions insuffisantes pour ajouter des utilisateurs",
      });
    }

    // Trouver l'utilisateur par email ou pseudo
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { pseudo: identifier }],
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà une permission sur cette note
    const existingPermission = await prisma.permission.findFirst({
      where: {
        userId: targetUser.id,
        noteId: noteId,
      },
    });

    if (existingPermission) {
      return res
        .status(400)
        .json({ error: "L'utilisateur a déjà accès à cette note" });
    }

    // Valider le rôle (doit être inférieur à celui de l'admin)
    const targetRole = parseInt(role) || 3; // Par défaut: Lecteur
    if (targetRole <= adminPermission.role) {
      return res.status(400).json({
        error: "Vous ne pouvez attribuer qu'un rôle inférieur au vôtre",
      });
    }

    // Créer la permission
    await prisma.permission.create({
      data: {
        noteId: noteId,
        userId: targetUser.id,
        role: targetRole,
      },
    });

    // Récupérer les informations de la note et de l'inviteur pour l'email
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { Titre: true },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: connected },
      select: { pseudo: true },
    });

    // Envoyer l'email d'invitation
    try {
      await sendNoteInvitationEmail(
        targetUser.email,
        inviter?.pseudo || "Un utilisateur",
        note?.Titre || "Sans titre",
        noteId,
        targetRole
      );
    } catch (emailError) {
      // L'email a échoué mais la permission a été créée avec succès
      console.error(
        "Erreur lors de l'envoi de l'email d'invitation:",
        emailError
      );
      // On continue quand même car la permission est créée
    }

    // 🔔 Envoyer une notification temps réel via WebSocket YJS
    try {
      await notifyInvitation(
        targetUser.id,
        noteId,
        note?.Titre || "Sans titre",
        targetRole,
        inviter?.pseudo || "Un utilisateur"
      );
    } catch (notifError) {
      console.error("Erreur lors de l'envoi de la notification YJS:", notifError);
      // On continue quand même car la permission est créée
    }

    // 🔔 Notifier les autres admins qu'un utilisateur a été invité
    try {
      await notifySomeoneInvited(
        noteId,
        note?.Titre || "Sans titre",
        targetUser.pseudo,
        targetRole,
        connected,
        inviter?.pseudo || "Un utilisateur"
      );
    } catch (notifError) {
      console.error("Erreur lors de l'envoi de la notification SOMEONE_INVITED:", notifError);
      // On continue quand même
    }

    res.json({
      success: true,
      message: `${targetUser.pseudo} ajouté avec succès`,
      user: {
        id: targetUser.id,
        pseudo: targetUser.pseudo,
        email: targetUser.email,
      },
      role: targetRole,
      emailSent: true, // Indiquer que l'email a été tenté
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de permission:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de l'ajout de l'utilisateur" });
  }
}

// Handler Express pour retirer une permission d'un utilisateur sur une note
async function RemovePermission(req, res) {
  const { noteId, userId } = req.params;
  const connected = req.session.userId;
  if (!connected) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  try {
    // Permission de l'utilisateur connecté sur cette note
    const adminPermission = await prisma.permission.findFirst({
      where: {
        userId: connected,
        noteId: noteId,
      },
    });
    if (!adminPermission || adminPermission.role > 1) {
      return res.status(403).json({
        error: "Permissions insuffisantes pour retirer un utilisateur",
      });
    }

    // Permission de l'utilisateur cible
    const userPermission = await prisma.permission.findFirst({
      where: {
        userId: parseInt(userId),
        noteId: noteId,
      },
    });
    if (adminPermission.role === 1 && userPermission.role === 1) {
      return res.status(403).json({
        error: "Un administrateur ne peut pas retirer un autre administrateur",
      });
    }

    // Récupérer les infos nécessaires pour les notifications
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { Titre: true },
    });
    const actor = await prisma.user.findUnique({
      where: { id: connected },
      select: { pseudo: true },
    });
    const removedUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { pseudo: true },
    });

    // 🔔 Notifier l'utilisateur de son exclusion
    try {
      await notifyUserRemoved(
        parseInt(userId),
        noteId,
        note?.Titre || "Sans titre",
        actor?.pseudo || "Un administrateur"
      );
    } catch (notifError) {
      console.error("[RemovePermission] Erreur notification REMOVED:", notifError);
      // Ne pas bloquer la suppression si la notification échoue
    }

    // 🔔 Notifier les autres admins qu'un collaborateur a été exclu
    try {
      await notifyCollaboratorRemoved(
        noteId,
        note?.Titre || "Sans titre",
        removedUser?.pseudo || "Un utilisateur",
        connected,
        actor?.pseudo || "Un administrateur"
      );
    } catch (notifError) {
      console.error("[RemovePermission] Erreur notification COLLABORATOR_REMOVED:", notifError);
      // Ne pas bloquer si la notification échoue
    }

    if (!userPermission) {
      return res
        .status(404)
        .json({ error: "Permission utilisateur cible introuvable" });
    }
    if (userPermission.role === 0) {
      return res
        .status(403)
        .json({ error: "Impossible de retirer le propriétaire de la note" });
    }

    await prisma.permission.delete({
      where: {
        noteId_userId: {
          noteId: noteId,
          userId: parseInt(userId),
        },
      },
    });
    res.json({ success: true, message: "Permission retirée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de permission:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression de permission" });
  }
}

export { getPermission, UpdatePermission, AddPermission, RemovePermission };
