import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DossierController = {
  // Créer un nouveau dossier
  createDossier: async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { Nom, Description, CouleurTag } = req.body || {};

    if (!Nom || Nom.trim() === "") {
      return res.status(400).json({ message: "Le nom du dossier est requis" });
    }

    const authorId = parseInt(req.session.userId);
    if (isNaN(authorId)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    try {
      const newFolder = await prisma.folder.create({
        data: {
          Nom: Nom.trim(),
          Description: Description?.trim() || null,
          CouleurTag: CouleurTag || "var(--primary)",
          authorId,
        },
      });

      return res
        .status(201)
        .json({ message: "Dossier créé avec succès", folder: newFolder });
    } catch (error) {
      
      return res
        .status(500)
        .json({
          message: "Erreur lors de la création du dossier",
          error: error.message,
        });
    }
  },

  // Get all folders for the authenticated user
  getFolders: async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const authorId = parseInt(req.session.userId);
    if (isNaN(authorId)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    try {
      const folders = await prisma.folder.findMany({
        where: {
          authorId,
          deletedAt: null,
        },
        orderBy: {
          ModifiedAt: "desc",
        },
      });

      // Vérifier s'il y a des entrées dans noteDossier pour cet utilisateur
      const totalNoteDossierEntries = await prisma.noteFolder.count({
        where: {
          userId: authorId,
        },
      });

      // Calculer le nombre de notes pour chaque dossier
      const foldersWithNoteCounts = await Promise.all(
        folders.map(async (folder) => {
          const noteCount = await prisma.noteFolder.count({
            where: {
              folderId: folder.id,
              userId: authorId,
              note: {
                deletedAt: null, // Exclure les notes supprimées du décompte
              },
            },
          });

          const allEntriesForFolder = await prisma.noteFolder.findMany({
            where: {
              folderId: folder.id,
            },
          });

          return {
            ...folder,
            noteCount,
          };
        })
      );

      console.log(
        `[DEBUG] Final folders with counts:`,
        foldersWithNoteCounts.map((f) => ({
          id: f.id,
          name: f.Nom,
          noteCount: f.noteCount,
        }))
      );

      return res.status(200).json({
        folders: foldersWithNoteCounts,
        totalFolders: foldersWithNoteCounts.length,
      });
    } catch (error) {
      
      return res
        .status(500)
        .json({
          message: "Erreur lors de la récupération des dossiers",
          error: error.message,
          stack: error.stack,
        });
    }
  },

  // Get folder by id
  getFolderById: async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { id } = req.params;
    const authorId = parseInt(req.session.userId);

    try {
      const folder = await prisma.folder.findFirst({
        where: {
          id,
          authorId,
          deletedAt: null,
        },
      });

      if (!folder) {
        return res.status(404).json({ message: "Dossier introuvable" });
      }

      // Récupérer toutes les notes du dossier (exclure les notes supprimées)
      const assignments = await prisma.noteFolder.findMany({
        where: {
          folderId: folder.id,
          userId: authorId,
          note: {
            deletedAt: null, // Exclure les notes supprimées
          },
        },
        include: {
          note: {
            include: {
              author: {
                select: {
                  id: true,
                  pseudo: true,
                },
              },
              permissions: {
                where: {
                  userId: authorId,
                },
                select: {
                  role: true,
                  isAccepted: true,
                },
              },
            },
          },
        },
      });

      // Formater les notes (filtrer celles qui ne sont pas nulles ou supprimées)
      const notes = assignments
        .filter(
          (assignment) => assignment.note && assignment.note.deletedAt === null
        )
        .map((assignment) => {
          const note = assignment.note;
          const permission = note.permissions[0];

          // Déterminer le rôle de l'utilisateur
          let userRole = 1; // Propriétaire par défaut
          if (note.authorId !== authorId && permission) {
            userRole = permission.role;
          }

          return {
            id: note.id,
            Titre: note.Titre,
            Content: note.Content,
            ModifiedAt: note.ModifiedAt,
            author: note.author,
            userRole: userRole,
            tag: note.tag, // Couleur du tag de la note
          };
        });

      return res.status(200).json({
        folder: {
          ...folder,
          noteCount: notes.length,
        },
        notes: notes,
      });
    } catch (error) {
      
      return res
        .status(500)
        .json({
          message: "Erreur lors de la récupération du dossier",
          error: error.message,
        });
    }
  },

  // Update folder
  updateFolder: async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { id } = req.params;
    const { Nom, Description, CouleurTag } = req.body || {};
    const authorId = parseInt(req.session.userId);

    try {
      const existing = await prisma.folder.findFirst({
        where: { id, authorId, deletedAt: null },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ message: "Dossier introuvable ou accès non autorisé" });
      }

      if (Nom !== undefined && Nom.trim() === "") {
        return res
          .status(400)
          .json({ message: "Le nom du dossier ne peut pas être vide" });
      }

      const updated = await prisma.folder.update({
        where: { id },
        data: {
          ...(Nom !== undefined && { Nom: Nom.trim() }),
          ...(Description !== undefined && {
            Description: Description?.trim() || null,
          }),
          ...(CouleurTag !== undefined && { CouleurTag }),
        },
      });

      return res.status(200).json({
        message: "Dossier mis à jour avec succès",
        folder: updated,
      });
    } catch (error) {
      
      return res.status(500).json({
        message: "Erreur lors de la mise à jour du dossier",
        error: error.message,
      });
    }
  },

  // Supprimer un dossier (suppression définitive)
  // Les notes contenues ne sont PAS supprimées, seules les relations noteFolder sont supprimées
  deleteDossier: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const authorId = parseInt(userId);

      // Vérifier que le dossier existe et appartient à l'utilisateur
      const existingDossier = await prisma.folder.findFirst({
        where: {
          id: id,
          authorId: authorId,
          deletedAt: null,
        },
      });

      if (!existingDossier) {
        return res
          .status(404)
          .json({ error: "Dossier introuvable ou accès non autorisé" });
      }

      // Supprimer toutes les relations noteFolder (onDelete: Cascade le fait automatiquement)
      // Les notes restent intactes, seules les assignations au dossier sont supprimées
      await prisma.noteFolder.deleteMany({
        where: {
          folderId: id,
          userId: authorId,
        },
      });

      // Suppression définitive du dossier
      await prisma.folder.delete({
        where: { id: id },
      });

      res.status(200).json({
        message: "Dossier supprimé définitivement avec succès",
      });
    } catch (error) {
      
      res
        .status(500)
        .json({ error: "Erreur serveur lors de la suppression du dossier" });
    }
  },

  // Ajouter une note à un dossier
  addNoteToFolder: async (req, res) => {
    try {
      const { noteId, dossierId } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      if (!noteId || !dossierId) {
        return res.status(400).json({ error: "ID note et ID dossier requis" });
      }

      const authorId = parseInt(userId);
      if (isNaN(authorId)) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
      }

      // Vérifier que l'utilisateur a accès à la note
      const noteAccess = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { authorId: authorId },
            {
              permissions: {
                some: {
                  userId: authorId,
                  isAccepted: true,
                },
              },
            },
          ],
        },
      });

      if (!noteAccess) {
        return res
          .status(404)
          .json({ error: "Note introuvable ou accès non autorisé" });
      }

      // Vérifier que l'utilisateur a accès au dossier
      const folderAccess = await prisma.folder.findFirst({
        where: {
          id: dossierId,
          authorId: authorId,
          deletedAt: null,
        },
      });

      if (!folderAccess) {
        return res
          .status(404)
          .json({ error: "Dossier introuvable ou accès non autorisé" });
      }

      // Supprimer l'ancienne assignation si elle existe
      await prisma.noteFolder.deleteMany({
        where: {
          noteId: noteId,
          userId: authorId,
        },
      });

      // Créer la nouvelle assignation
      const assignment = await prisma.noteFolder.create({
        data: {
          noteId: noteId,
          folderId: dossierId,
          userId: authorId,
        },
      });

      res.status(200).json({
        message: "Note ajoutée au dossier avec succès",
        assignment: assignment,
      });
    } catch (error) {
      
      res
        .status(500)
        .json({
          error: "Erreur serveur lors de l'ajout de la note au dossier",
        });
    }
  },

  // Retirer une note d'un dossier
  removeNoteFromFolder: async (req, res) => {
    try {
      const { noteId } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      if (!noteId) {
        return res.status(400).json({ error: "ID note requis" });
      }

      const authorId = parseInt(userId);
      if (isNaN(authorId)) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
      }

      // Supprimer l'assignation
      const deleted = await prisma.noteFolder.deleteMany({
        where: {
          noteId: noteId,
          userId: authorId,
        },
      });

      if (deleted.count === 0) {
        return res
          .status(404)
          .json({ error: "Aucune assignation trouvée pour cette note" });
      }

      res.status(200).json({
        message: "Note retirée du dossier avec succès",
      });
    } catch (error) {
      
      res
        .status(500)
        .json({
          error: "Erreur serveur lors de la suppression de l'assignation",
        });
    }
  },

  // Obtenir le dossier d'une note
  getNoteFolder: async (req, res) => {
    try {
      const { noteId } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const authorId = parseInt(userId);
      if (isNaN(authorId)) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
      }

      const assignment = await prisma.noteFolder.findFirst({
        where: {
          noteId: noteId,
          userId: authorId,
        },
        include: {
          folder: true,
        },
      });

      if (!assignment) {
        return res.status(200).json({ folder: null });
      }

      res.status(200).json({ folder: assignment.folder });
    } catch (error) {
      
      res
        .status(500)
        .json({ error: "Erreur serveur lors de la récupération du dossier" });
    }
  },

  // Récupérer toutes les notes d'un dossier
  getFolderNotes: async (req, res) => {
    try {
      const { folderId } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      const authorId = parseInt(userId);
      if (isNaN(authorId)) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
      }

      // Vérifier que l'utilisateur a accès au dossier
      const folderAccess = await prisma.folder.findFirst({
        where: {
          id: folderId,
          authorId: authorId,
          deletedAt: null,
        },
      });

      if (!folderAccess) {
        return res
          .status(404)
          .json({ error: "Dossier introuvable ou accès non autorisé" });
      }

      // Récupérer toutes les notes du dossier (exclure les notes supprimées)
      const assignments = await prisma.noteFolder.findMany({
        where: {
          folderId: folderId,
          userId: authorId,
          note: {
            deletedAt: null, // Exclure les notes supprimées
          },
        },
        include: {
          note: {
            include: {
              author: {
                select: {
                  id: true,
                  pseudo: true,
                },
              },
              permissions: {
                where: {
                  userId: authorId,
                },
                select: {
                  role: true,
                  isAccepted: true,
                },
              },
            },
          },
        },
      });

      // Formater les notes (filtrer celles qui ne sont pas nulles ou supprimées)
      const notes = assignments
        .filter(
          (assignment) => assignment.note && assignment.note.deletedAt === null
        )
        .map((assignment) => {
          const note = assignment.note;
          const permission = note.permissions[0];

          // Déterminer le rôle de l'utilisateur
          let userRole = 1; // Propriétaire par défaut
          if (note.authorId !== authorId && permission) {
            userRole = permission.role;
          }

          return {
            id: note.id,
            Titre: note.Titre,
            Content: note.Content,
            ModifiedAt: note.ModifiedAt,
            author: note.author,
            userRole: userRole,
          };
        });

      res.status(200).json({
        notes: notes,
        totalNotes: notes.length,
      });
    } catch (error) {
      
      res
        .status(500)
        .json({ error: "Erreur serveur lors de la récupération des notes" });
    }
  },
};
