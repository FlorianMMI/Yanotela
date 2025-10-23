import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Controller for folder management
export const FolderController = {
  // Create a new folder
  createFolder: async (req, res) => {
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
          CouleurTag: CouleurTag || "#D4AF37",
          authorId,
        },
      });

      return res.status(201).json({ message: "Dossier créé avec succès", folder: newFolder });
    } catch (error) {
      console.error("[createFolder] Error:", error);
      return res.status(500).json({ message: "Erreur lors de la création du dossier", error: error.message });
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

      const foldersFormatted = folders.map((f) => ({ ...f, noteCount: 0 }));
      return res.status(200).json({ folders: foldersFormatted, totalFolders: foldersFormatted.length });
    } catch (error) {
      console.error("[getFolders] Error:", error);
      return res.status(500).json({ message: "Erreur lors de la récupération des dossiers", error: error.message, stack: error.stack });
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

      return res.status(200).json({ folder: { ...folder, noteCount: 0 } });
    } catch (error) {
      console.error("[getFolderById] Error:", error);
      return res.status(500).json({ message: "Erreur lors de la récupération du dossier", error: error.message });
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
      const existing = await prisma.folder.findFirst({ where: { id, authorId, deletedAt: null } });
      if (!existing) {
        return res.status(404).json({ message: "Dossier introuvable ou accès non autorisé" });
      }

      if (Nom !== undefined && Nom.trim() === "") {
        return res.status(400).json({ message: "Le nom du dossier ne peut pas être vide" });
      }

      const updated = await prisma.folder.update({
        where: { id },
        data: {
          ...(Nom !== undefined && { Nom: Nom.trim() }),
          ...(Description !== undefined && { Description: Description?.trim() || null }),
          ...(CouleurTag !== undefined && { CouleurTag }),
        },
      });

      return res.status(200).json({ message: "Dossier mis à jour avec succès", folder: updated });
    } catch (error) {
      console.error("[updateFolder] Error:", error);
      return res.status(500).json({ message: "Erreur lors de la mise à jour du dossier", error: error.message });
    }
  },

  // Soft delete folder
  deleteFolder: async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { id } = req.params;
    const authorId = parseInt(req.session.userId);

    try {
      const existing = await prisma.folder.findFirst({ where: { id, authorId, deletedAt: null } });
      if (!existing) {
        return res.status(404).json({ message: "Dossier introuvable ou accès non autorisé" });
      }

            // Mettre à jour le dossier
            const updatedDossier = await prisma.dossier.update({
                where: { id: id },
                data: {
                    ...(Nom !== undefined && { Nom: Nom.trim() }),
                    ...(Description !== undefined && { Description: Description?.trim() || null }),
                    ...(CouleurTag !== undefined && { CouleurTag }),
                },
            });

            res.status(200).json({ 
                message: 'Dossier mis à jour avec succès',
                folder: updatedDossier 
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du dossier:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du dossier' });
        }
    },

    // Supprimer un dossier (soft delete)
    deleteDossier: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            // Convertir userId en Int
            const authorId = parseInt(userId);

            // Vérifier que le dossier existe et appartient à l'utilisateur
            const existingDossier = await prisma.dossier.findFirst({
                where: {
                    id: id,
                    authorId: authorId,
                    deletedAt: null,
                },
            });

            if (!existingDossier) {
                return res.status(404).json({ error: 'Dossier introuvable ou accès non autorisé' });
            }

            // Soft delete
            await prisma.dossier.update({
                where: { id: id },
                data: {
                    deletedAt: new Date(),
                },
            });

            res.status(200).json({ 
                message: 'Dossier supprimé avec succès' 
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du dossier:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la suppression du dossier' });
        }
    },

    // Ajouter une note à un dossier
    addNoteToFolder: async (req, res) => {
        try {
            const { noteId, dossierId } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            if (!noteId || !dossierId) {
                return res.status(400).json({ error: 'ID note et ID dossier requis' });
            }

            const authorId = parseInt(userId);
            if (isNaN(authorId)) {
                return res.status(400).json({ error: 'ID utilisateur invalide' });
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
                                    isAccepted: true
                                }
                            }
                        }
                    ]
                }
            });

            if (!noteAccess) {
                return res.status(404).json({ error: 'Note introuvable ou accès non autorisé' });
            }

            // Vérifier que l'utilisateur a accès au dossier
            const folderAccess = await prisma.dossier.findFirst({
                where: {
                    id: dossierId,
                    authorId: authorId,
                    deletedAt: null
                }
            });

            if (!folderAccess) {
                return res.status(404).json({ error: 'Dossier introuvable ou accès non autorisé' });
            }

            // Supprimer l'ancienne assignation si elle existe
            await prisma.noteDossier.deleteMany({
                where: {
                    noteId: noteId,
                    userId: authorId
                }
            });

            // Créer la nouvelle assignation
            const assignment = await prisma.noteDossier.create({
                data: {
                    noteId: noteId,
                    dossierId: dossierId,
                    userId: authorId
                }
            });

            res.status(200).json({ 
                message: 'Note ajoutée au dossier avec succès',
                assignment: assignment 
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la note au dossier:', error);
            res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de la note au dossier' });
        }
    },

    // Retirer une note d'un dossier
    removeNoteFromFolder: async (req, res) => {
        try {
            const { noteId } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            if (!noteId) {
                return res.status(400).json({ error: 'ID note requis' });
            }

            const authorId = parseInt(userId);
            if (isNaN(authorId)) {
                return res.status(400).json({ error: 'ID utilisateur invalide' });
            }

            // Supprimer l'assignation
            const deleted = await prisma.noteDossier.deleteMany({
                where: {
                    noteId: noteId,
                    userId: authorId
                }
            });

            if (deleted.count === 0) {
                return res.status(404).json({ error: 'Aucune assignation trouvée pour cette note' });
            }

            res.status(200).json({ 
                message: 'Note retirée du dossier avec succès' 
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'assignation:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'assignation' });
        }
    },

    // Obtenir le dossier d'une note
    getNoteFolder: async (req, res) => {
        try {
            const { noteId } = req.params;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            const authorId = parseInt(userId);
            if (isNaN(authorId)) {
                return res.status(400).json({ error: 'ID utilisateur invalide' });
            }

            const assignment = await prisma.noteDossier.findFirst({
                where: {
                    noteId: noteId,
                    userId: authorId
                },
                include: {
                    dossier: true
                }
            });

            if (!assignment) {
                return res.status(200).json({ folder: null });
            }

            res.status(200).json({ folder: assignment.dossier });
        } catch (error) {
            console.error('Erreur lors de la récupération du dossier de la note:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la récupération du dossier' });
        }
    },
};