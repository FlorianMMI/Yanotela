/**
 * Contrôleur pour la gestion des notes.
 *
 * Ce fichier fournit les fonctions pour :
 * - Récupérer toutes les notes depuis la base de données.
 * - Créer une nouvelle note avec un titre, un contenu et un identifiant d'auteur.
 *
 * Utilise Prisma comme ORM pour interagir avec la base de données.
 *
 * Fonctions exportées :
 * - getNotes : Récupère toutes les notes.
 * - createNote : Crée une nouvelle note après validation des champs requis.
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { getPermission } from "./permissionController.js";

const prisma = new PrismaClient();

export const noteController = {
  getNotes: async (req, res) => {
    // Vérifier l'authentification
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Récupérer toutes les notes où l'utilisateur a des permissions

      const permissions = await prisma.permission.findMany({
        where: {
          userId: req.session.userId,
          isAccepted: true,
        },
        include: {
          note: {
            include: {
              author: true,
              modifier: true,
            },
          },
        },
      });

      // Extraire les notes et formater author/modifier en pseudo
      const notes = permissions.map((perm) => {
        const note = perm.note;
        return {
          id: note.id,
          Titre: note.Titre,
          Content: note.Content,
          author: note.author ? note.author.pseudo : null,
          modifier: note.modifier ? note.modifier.pseudo : null,
          ModifiedAt: note.ModifiedAt,
          userRole: perm.role,
        };
      });

      // Trier par date de modification
      notes.sort((a, b) => new Date(b.ModifiedAt) - new Date(a.ModifiedAt));

      const totalNotes = notes.length;

      res.status(200).json({ notes, totalNotes });
    } catch (error) {
      console.error("Erreur lors de la récupération des notes:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la récupération des notes",
          error: error.message,
          stack: error.stack,
        });
    }
  },

  createNote: async (req, res) => {
    // Vérifier si l'utilisateur est authentifié via la session
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    if (!req.body) {
      return res
        .status(400)
        .json({ message: "Aucune donnée reçue dans req.body" });
    }

    if (
      req.body == {} ||
      req.body == null ||
      Object.keys(req.body).length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Aucune donnée reçue dans req.body" });
    }


    let { Titre, Content } = req.body;
    // Récupérer l'authorId depuis la session au lieu du body
    const authorId = parseInt(req.session.userId); // Convertir en Int pour la DB

    if (!Titre) {
      return res.status(400).json({ message: "Titre requis" });
    }

    if (Content == "" || Content == null || Content == undefined) {
      Content = JSON.stringify({
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: "",
                  type: "text",
                  version: 1
                }
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
              textFormat: 0,
              textStyle: ""
            }
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "root",
          version: 1
        }
      });
      
    }

    try {
      // Générer un UUID plus simple et fiable
      const UID = crypto.randomBytes(8).toString("hex"); // 16 characters

      const note = await prisma.note.create({
        data: {
          id: UID,
          Titre,
          Content,
          authorId,
          modifierId: authorId, // Le propriétaire est aussi le premier modificateur
          permissions: {
            create: {
              userId: authorId,
              role: 0, // Rôle 0 = Propriétaire
              isAccepted: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Note créée avec succès",
        note,
        redirectUrl: `/notes/${note.id}`,
      });
    } catch (error) {
      console.error("Erreur lors de la création de la note:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la création de la note",
          error: error.message,
        });
    }
  },

  getNoteById: async (req, res) => {
    const { id } = req.params;
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const note = await prisma.note.findUnique({
        where: { id: id },
        include: {
          author: true,
          modifier: true,
        },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Récupérer le rôle de l'utilisateur sur cette note
      const userPermission = await getPermission(userId, id);

      if (!userPermission) {
        return res
          .status(403)
          .json({ message: "Vous n'avez pas accès à cette note" });
      }

      res.status(200).json({
        Titre: note.Titre,
        Content: note.Content,
        author: note.author ? note.author.pseudo : null,
        modifier: note.modifier ? note.modifier.pseudo : null,
        ModifiedAt: note.ModifiedAt,
        userRole: userPermission.role, // Ajouter le rôle pour le front
      });
    } catch (error) {
      console.error("[getNoteById] Error:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la récupération de la note",
          error: error.message,
        });
    }
  },

  updateNoteById: async (req, res) => {
    const { id } = req.params;
    let { Titre, Content } = req.body;

    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    if (!Titre || !Content) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    if (Titre === "") {
      Titre = "Sans titre";
    }

    try {
      // Vérifier les permissions (await car async)
      const userPermission = await getPermission(userId, id);

      if (!userPermission) {
        return res
          .status(403)
          .json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Seuls propriétaire (0), admin (1) et éditeur (2) peuvent modifier
      if (userPermission.role > 2) {
        return res
          .status(403)
          .json({
            message:
              "Vous n'avez pas la permission de modifier cette note (lecture seule)",
          });
      }

      const note = await prisma.note.update({
        where: { id: id },
        data: {
          Titre,
          Content,
          ModifiedAt: new Date(),
          modifierId: parseInt(userId), // Enregistre le dernier modificateur
        },
      });
      res.status(200).json({ message: "Note mise à jour avec succès", note });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la note:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la mise à jour de la note",
          error: error.message,
        });
    }
  },

  getNoteNotAccepted: async (req, res) => {
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Rechercher les permissions non acceptées pour cet utilisateur et inclure la note liée
      const permissions = await prisma.permission.findMany({
        where: {
          userId: parseInt(userId),
          isAccepted: false,
        },
        include: {
          note: {
            include: {
              author: true,
              modifier: true,
            },
          },
        },
      });

      // Extraire les notes depuis les permissions
      const notes = permissions.map((perm) => {
        const note = perm.note;
        return {
          id: note.id,
          Titre: note.Titre,
          Content: note.Content,
          author: note.author ? note.author.pseudo : null,
          modifier: note.modifier ? note.modifier.pseudo : null,
          ModifiedAt: note.ModifiedAt,
          userRole: perm.role,
          isAccepted: perm.isAccepted,
        };
      });
      console.log("[getNoteNotAccepted] Retrieved notes:", notes);
      res.status(200).json({ notes });
    } catch (error) {
      console.error("[getNoteNotAccepted] Error:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la récupération de la note",
          error: error.message,
        });
    }
  },

  acceptInvitation: async (req, res) => {
    const { id } = req.params;
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const permission = await prisma.permission.updateMany({
        where: {
          noteId: id,
          userId: userId,
          isAccepted: false,
        },
        data: {
          isAccepted: true,
        },
      });

      if (permission.count === 0) {
        return res
          .status(404)
          .json({ message: "Invitation non trouvée ou déjà acceptée" });
      }

      res.status(200).json({ message: "Invitation acceptée avec succès" });
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'invitation:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de l'acceptation de l'invitation",
          error: error.message,
        });
    }
  },

  deleteInvitation: async (req, res) => {
    const { id } = req.params;
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Cherche la permission liée à cette note et cet utilisateur
      const permission = await prisma.permission.findFirst({
        where: {
          noteId: id,
          userId: parseInt(userId),
        },
      });

      if (!permission) {
        return res.status(404).json({ message: "Invitation non trouvée" });
      }

      // Vérifier que la note existe et récupérer son auteur
      const note = await prisma.note.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Autoriser la suppression si l'utilisateur est le destinataire de l'invitation ou l'auteur de la note
      if (
        permission.userId !== parseInt(userId) &&
        note.authorId !== parseInt(userId)
      ) {
        return res
          .status(403)
          .json({
            message:
              "Vous n'avez pas la permission de supprimer cette invitation",
          });
      }

      // Supprimer l'invitation en utilisant deleteMany (le modèle Permission utilise une clé composite)
      const deleted = await prisma.permission.deleteMany({
        where: { noteId: id, userId: parseInt(userId) },
      });

      if (deleted.count === 0) {
        return res.status(404).json({ message: "Invitation non trouvée" });
      }

      res.status(200).json({ message: "Invitation supprimée avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'invitation:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la suppression de l'invitation",
          error: error.message,
        });
    }
  },
};
