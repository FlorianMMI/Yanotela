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
import { migrateContentToYjs, needsMigration, extractContentFromYjs } from "../services/yjsMigration.js";

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
          note: {
            deletedAt: null, // Exclure les notes supprimées
          },
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
      const notes = await Promise.all(
        permissions.map(async (perm) => {
          const note = perm.note;
          
          // Compter le nombre de collaborateurs (permissions acceptées)
          const collaboratorCount = await prisma.permission.count({
            where: {
              noteId: note.id,
              isAccepted: true,
            },
          });

          return {
            id: note.id,
            Titre: note.Titre,
            Content: note.Content,
            tag: note.tag, // Ajouter le tag de la note
            author: note.author ? note.author.pseudo : null,
            modifier: note.modifier ? note.modifier.pseudo : null,
            ModifiedAt: note.ModifiedAt,
            userRole: perm.role,
            collaboratorCount: collaboratorCount,
            isPublic: note.isPublic
          };
        })
      );

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

  duplicateNote: async (req, res) => {
    // Vérifier si l'utilisateur est authentifié via la session
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { id } = req.params; // ID de la note à dupliquer
    const userId = parseInt(req.session.userId);

    try {
      // Récupérer la note originale
      const originalNote = await prisma.note.findUnique({
        where: { id: id },
        include: {
          permissions: true,
        },
      });

      if (!originalNote) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Vérifier si la note est supprimée
      if (originalNote.deletedAt) {
        return res.status(404).json({ message: "Cette note a été supprimée" });
      }

      // Vérifier si l'utilisateur a accès à cette note
      const userPermission = await getPermission(userId, id);
      if (!userPermission) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Générer un nouvel ID pour la note dupliquée
      const newUID = crypto.randomBytes(8).toString("hex");

      // Créer la nouvelle note avec le contenu de l'originale
      const duplicatedNote = await prisma.note.create({
        data: {
          id: newUID,
          Titre: `${originalNote.Titre} (copie)`,
          Content: originalNote.Content,
          authorId: userId, // L'utilisateur devient le propriétaire de la copie
          modifierId: userId,
          permissions: {
            create: {
              userId: userId,
              role: 0, // Rôle 0 = Propriétaire
              isAccepted: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Note dupliquée avec succès",
        note: duplicatedNote,
        redirectUrl: `/notes/${duplicatedNote.id}`,
      });
    } catch (error) {
      console.error("Erreur lors de la duplication de la note:", error);
      res
        .status(500)
        .json({
          message: "Erreur lors de la duplication de la note",
          error: error.message,
        });
    }
  },

  getNoteById: async (req, res) => {
    const { id } = req.params;
    const { userId } = req.session;

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

      // Vérifier si la note est supprimée
      if (note.deletedAt) {
        return res.status(404).json({ message: "Cette note a été supprimée" });
      }

      let userPermission = null;
      let userRole = 3; // Par défaut : lecteur (pour les utilisateurs non authentifiés sur notes publiques)

      // Si l'utilisateur est authentifié, vérifier ses permissions
      if (userId) {
        userPermission = await getPermission(userId, id);
        
        if (userPermission) {
          // L'utilisateur a une permission spécifique
          userRole = userPermission.role;
        } else if (!note.isPublic) {
          // Note privée et pas de permission : refuser l'accès
          return res
            .status(403)
            .json({ message: "Vous n'avez pas accès à cette note" });
        } else {
          
          try {
            await prisma.permission.create({
              data: {
                noteId: id,
                userId: userId,
                role: 3, // Lecteur
                isAccepted: true, // Auto-acceptée car c'est une note publique
              },
            });
            userRole = 3;
        
          } catch (permError) {
            // Gérer le cas où la permission existe déjà (contrainte unique)
            if (permError.code === 'P2002') {
              // Re-fetch la permission qui existe déjà
              userPermission = await getPermission(userId, id);
              if (userPermission) {
                userRole = userPermission.role;
              }
            } else {
              console.error("❌ Erreur lors de la création de la permission:", permError);
              // Continuer quand même avec le rôle par défaut (3)
            }
          }
        }
      } else {
        // Utilisateur non authentifié
        if (!note.isPublic) {
          // Note privée : refuser l'accès
          return res.status(401).json({ 
            message: "Authentification requise pour accéder à cette note",
            authenticated: false 
          });
        }
        // Note publique : autoriser l'accès en lecture seule (rôle 3)
      }

      if (needsMigration(note)) {
        
        const yjsState = migrateContentToYjs(note.Content);
        
        if (yjsState) {
          // Sauvegarder le yjsState dans la base
          await prisma.note.update({
            where: { id },
            data: { yjsState },
          });
          
        }
      }

      res.status(200).json({
        Titre: note.Titre,
        Content: note.Content,
        author: note.author ? note.author.pseudo : null,
        modifier: note.modifier ? note.modifier.pseudo : null,
        ModifiedAt: note.ModifiedAt,
        userRole: userRole, // Rôle de l'utilisateur (3 par défaut pour accès public)
        tag: note.tag, // Couleur du tag de la note
        isPublic: note.isPublic, // Indiquer si la note est publique
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

    // Vérification supplémentaire : empêcher toute modification si le rôle est 3 (lecteur)
    if (req.userPermission && req.userPermission.role === 3) {
      return res.status(403).json({ message: "Vous n'avez que les droits de lecture sur cette note" });
    }

    // Pas besoin de vérifier userId et permissions, le middleware requireWriteAccess l'a déjà fait

    // Au moins un champ doit être fourni
    if (!Titre && !Content) {
      return res.status(400).json({ message: "Au moins un champ (Titre ou Content) doit être fourni" });
    }

    if (Titre === "") {
      Titre = "Sans titre";
    }

    try {
      // Préparer l'objet de mise à jour avec seulement les champs fournis
      const updateData = {
        ModifiedAt: new Date(),
        modifierId: parseInt(userId), // Enregistre le dernier modificateur
      };

      if (Titre !== undefined) {
        updateData.Titre = Titre;
      }

      if (Content !== undefined) {
        updateData.Content = Content;
        
      }

      const note = await prisma.note.update({
        where: { id: id },
        data: updateData,
      });
      
      res.status(200).json({ message: "Note mise à jour avec succès", note });
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour de la note:", error);
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

      res.status(200).json({ message: "Invitation acceptée avec succès", noteId: id });
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

  // Assigner une note à un dossier
  assignFolder: async (req, res) => {
    const { id } = req.params; // noteId
    const { folderId } = req.body;
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    if (!folderId) {
      return res.status(400).json({ message: "folderId requis" });
    }

    try {
      // Vérifier que la note existe et que l'utilisateur a accès
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Vérifier les permissions sur la note
      const userPermission = await getPermission(userId, id);
      if (!userPermission) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Vérifier que le dossier existe et appartient à l'utilisateur
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }

      if (folder.authorId !== parseInt(userId)) {
        return res.status(403).json({ message: "Vous n'avez pas accès à ce dossier" });
      }

      // Vérifier si la note est déjà dans un dossier
      const existingAssignment = await prisma.noteFolder.findUnique({
        where: { noteId: id },
      });

      if (existingAssignment) {
        // Si c'est le même dossier, ne rien faire
        if (existingAssignment.folderId === folderId) {
          return res.status(200).json({ 
            message: "La note est déjà dans ce dossier",
            noteFolder: existingAssignment 
          });
        }

        // Sinon, mettre à jour le dossier
        const updatedAssignment = await prisma.noteFolder.update({
          where: { noteId: id },
          data: {
            folderId,
            userId: parseInt(userId),
            addedAt: new Date(),
          },
        });

        return res.status(200).json({
          message: "Note déplacée vers le nouveau dossier",
          noteFolder: updatedAssignment,
        });
      }

      // Créer la nouvelle assignation
      const noteFolder = await prisma.noteFolder.create({
        data: {
          noteId: id,
          folderId,
          userId: parseInt(userId),
        },
      });

      res.status(201).json({
        message: "Note assignée au dossier avec succès",
        noteFolder,
      });
    } catch (error) {
      console.error("Erreur lors de l'assignation de la note au dossier:", error);
      res.status(500).json({
        message: "Erreur lors de l'assignation de la note au dossier",
        error: error.message,
      });
    }
  },

  // Retirer une note d'un dossier
  removeFolder: async (req, res) => {
    const { id } = req.params; // noteId
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Vérifier que la note existe et que l'utilisateur a accès
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Vérifier les permissions sur la note
      const userPermission = await getPermission(userId, id);
      if (!userPermission) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Vérifier si la note est dans un dossier
      const existingAssignment = await prisma.noteFolder.findUnique({
        where: { noteId: id },
      });

      if (!existingAssignment) {
        return res.status(404).json({ message: "La note n'est pas dans un dossier" });
      }

      // Supprimer l'assignation
      await prisma.noteFolder.delete({
        where: { noteId: id },
      });

      res.status(200).json({ message: "Note retirée du dossier avec succès" });
    } catch (error) {
      console.error("Erreur lors du retrait de la note du dossier:", error);
      res.status(500).json({
        message: "Erreur lors du retrait de la note du dossier",
        error: error.message,
      });
    }
  },

  // Récupérer le dossier d'une note
  getNoteFolder: async (req, res) => {
    const { id } = req.params; // noteId
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Vérifier que la note existe et que l'utilisateur a accès
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Vérifier les permissions sur la note
      const userPermission = await getPermission(userId, id);
      if (!userPermission) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Récupérer l'assignation de dossier
      const noteFolder = await prisma.noteFolder.findUnique({
        where: { noteId: id },
        include: {
          folder: true,
        },
      });

      if (!noteFolder) {
        return res.status(200).json({ folder: null });
      }

      res.status(200).json({ folder: noteFolder.folder });
    } catch (error) {
      console.error("Erreur lors de la récupération du dossier de la note:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération du dossier de la note",
        error: error.message,
      });
    }
  },

  deleteNote: async (req, res) => {
    const { id } = req.params; // noteId
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Vérifier que la note existe
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Vérifier que la note n'est pas déjà supprimée
      if (note.deletedAt) {
        return res.status(400).json({ message: "Cette note est déjà supprimée" });
      }

      // Vérifier les permissions (seul Owner ou Admin peut supprimer)
      const userPermission = await getPermission(userId, id);
      
      if (!userPermission) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Role 0 = Owner, Role 1 = Admin
      if (userPermission.role !== 0 && userPermission.role !== 1) {
        return res.status(403).json({ 
          message: "Seul le propriétaire ou un administrateur peut supprimer cette note" 
        });
      }

      // Soft delete: définir deletedAt à la date actuelle ET nettoyer les relations NoteFolder
      const deletedNote = await prisma.$transaction(async (prisma) => {
        // Supprimer les relations NoteFolder pour éviter les interférences avec les dossiers
        await prisma.noteFolder.deleteMany({
          where: { noteId: id }
        });

        // Soft delete de la note
        return await prisma.note.update({
          where: { id },
          data: {
            deletedAt: new Date(),
          },
        });
      });

      res.status(200).json({ 
        message: "Note supprimée avec succès",
        noteId: deletedNote.id 
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la note:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression de la note",
        error: error.message,
      });
    }
  },

  leaveNote: async (req, res) => {
    const { id } = req.params; // noteId
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Vérifier que la note existe
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      // Vérifier les permissions de l'utilisateur
      const userPermission = await getPermission(userId, id);
      
      if (!userPermission) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette note" });
      }

      // Empêcher le propriétaire de quitter sa propre note
      if (userPermission.role === 0) {
        return res.status(403).json({ 
          message: "En tant que propriétaire, vous ne pouvez pas quitter cette note. Vous devez la supprimer." 
        });
      }

      // Supprimer la permission (l'utilisateur quitte la note)
      // La table Permission utilise une clé primaire composite (noteId, userId)
      await prisma.permission.delete({
        where: {
          noteId_userId: {
            noteId: id,
            userId: userId,
          },
        },
      });

      res.status(200).json({ 
        message: "Vous avez quitté la note avec succès",
        noteId: note.id 
      });
    } catch (error) {
      console.error("Erreur lors de la sortie de la note:", error);
      res.status(500).json({
        message: "Erreur lors de la sortie de la note",
        error: error.message,
      });
    }
  },

  getDeletedNotes: async (req, res) => {
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Récupérer toutes les notes supprimées de l'utilisateur
      const notes = await prisma.note.findMany({
        where: {
          authorId: userId,
          deletedAt: {
            not: null, // Notes qui ont été supprimées
          },
        },
        orderBy: {
          deletedAt: 'desc', // Plus récemment supprimées en premier
        },
      });

      res.status(200).json({
        notes: notes,
        totalNotes: notes.length,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des notes supprimées:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des notes supprimées",
        error: error.message,
      });
    }
  },

  restoreNote: async (req, res) => {
    const { id } = req.params; // noteId
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      // Vérifier que la note existe et est supprimée
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }

      if (!note.deletedAt) {
        return res.status(400).json({ message: "Cette note n'est pas supprimée" });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (note.authorId !== userId) {
        return res.status(403).json({ 
          message: "Seul le propriétaire peut restaurer cette note" 
        });
      }

      // Restaurer la note (remettre deletedAt à null)
      const restoredNote = await prisma.note.update({
        where: { id },
        data: {
          deletedAt: null,
        },
      });

      res.status(200).json({ 
        message: "Note restaurée avec succès",
        note: restoredNote 
      });
    } catch (error) {
      console.error("Erreur lors de la restauration de la note:", error);
      res.status(500).json({
        message: "Erreur lors de la restauration de la note",
        error: error.message,
      });
    }
  },

  /**
   * Synchroniser l'état YJS et le contenu Lexical en base de données
   * Utilisé par la collaboration temps réel pour persister les changements
   * 
   * @route POST /note/sync/:id
   * @middleware requireWriteAccess
   */
  syncNoteState: async (req, res) => {
    const { id } = req.params;
    const { yjsState, Content, Titre } = req.body;
    const { userId } = req.session;

    // Vérification supplémentaire : empêcher toute modification si le rôle est 3 (lecteur)
    if (req.userPermission && req.userPermission.role === 3) {
      return res.status(403).json({ message: "Vous n'avez que les droits de lecture sur cette note" });
    }

    try {
      // Convertir le tableau d'octets en Buffer si nécessaire
      const yjsBuffer = yjsState ? Buffer.from(yjsState) : null;

      // Préparer les données à mettre à jour
      const updateData = {
        yjsState: yjsBuffer,
        Content: Content,
        ModifiedAt: new Date(),
        modifierId: userId,
      };

      // Ajouter le titre s'il est fourni
      if (Titre !== undefined) {
        updateData.Titre = Titre;
        
      }

      // Mettre à jour la note avec le nouvel état YJS et le contenu
      const updatedNote = await prisma.note.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({ 
        message: "État synchronisé",
        ModifiedAt: updatedNote.ModifiedAt 
      });
    } catch (error) {
      console.error("[syncNoteState] Erreur:", error);
      res.status(500).json({
        message: "Erreur lors de la synchronisation",
        error: error.message,
      });
    }
  },


  setPublicNote: async (req, res) => {
    const { id } = req.params;
    
    try {
      var note = await prisma.note.findUnique({
        where: { id },
        select: { isPublic: true },
      });

      if (note) {
        const updated = await prisma.note.update({
          where: { id },
          data: { isPublic: !note.isPublic },
          select: { isPublic: true },
        });
        note = updated;
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la note publique:", error);
      return res.status(500).json({
        message: "Erreur lors de la vérification de la note publique",
        error: error.message,
      });
    }

    if (!note) {
      return res.status(404).json({ message: "Note non trouvée" });
    }

    res.status(200).json({ isPublic: note.isPublic });
  },

  isPublicNote: async (req, res) => {
    const { id } = req.params;
    
    try {
      const note = await prisma.note.findUnique({
        where: { id },
        select: { isPublic: true },
      });
      
      if (!note) {
        return res.status(404).json({ message: "Note non trouvée" });
      }
      res.status(200).json({ isPublic: note.isPublic });
    } catch (error) {
      console.error("Erreur lors de la vérification de la note publique:", error);
      return res.status(500).json({
        message: "Erreur lors de la vérification de la note publique",
        error: error.message,
      });
    }
  },
  /**
   * Mettre à jour le tag d'une note
   * 
   * @route PATCH /note/tag/:id
   * @middleware requireWriteAccess
   */
  updateNoteTag: async (req, res) => {
    const { id } = req.params;
    const { tag } = req.body;
    const { userId } = req.session;

    // Vérification supplémentaire : empêcher toute modification si le rôle est 3 (lecteur)
    if (req.userPermission && req.userPermission.role === 3) {
      return res.status(403).json({ message: "Vous n'avez que les droits de lecture sur cette note" });
    }

    // Validation du tag (doit être une couleur hex valide ou vide)
    if (tag && typeof tag === 'string' && tag !== '') {
      const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
      const cssVarRegex = /^var\(--[a-zA-Z-]+\)$/;
      
      if (!hexColorRegex.test(tag) && !cssVarRegex.test(tag)) {
        return res.status(400).json({ 
          message: "Le tag doit être une couleur hexadécimale valide (#000000) ou une variable CSS (var(--primary))" 
        });
      }
    }

    try {
      // Mettre à jour le tag de la note
      const updatedNote = await prisma.note.update({
        where: { id },
        data: {
          tag: tag || null, // Permet de supprimer le tag en passant une chaîne vide
          ModifiedAt: new Date(),
          modifierId: userId,
        },
      });

      res.status(200).json({ 
        message: "Tag mis à jour avec succès",
        tag: updatedNote.tag 
      });
    } catch (error) {
      console.error("[updateNoteTag] Erreur:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour du tag",
        error: error.message,
      });
    }
  },
};
