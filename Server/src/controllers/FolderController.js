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
        include: {
          noteFolders: {
            include: {
              note: {
                include: {
                  permissions: {
                    where: {
                      userId: authorId,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          ModifiedAt: "desc",
        },
      });

      // Calculer le nombre de notes pour chaque dossier (seulement celles accessibles)
      const foldersFormatted = folders.map((f) => ({
        id: f.id,
        Nom: f.Nom,
        Description: f.Description,
        CouleurTag: f.CouleurTag,
        authorId: f.authorId,
        CreatedAt: f.CreatedAt,
        ModifiedAt: f.ModifiedAt,
        noteCount: f.noteFolders.filter(nf => nf.note.permissions.length > 0).length,
      }));

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

      // Récupérer les notes liées à ce dossier
      const noteFolders = await prisma.noteFolder.findMany({
        where: {
          folderId: id,
        },
        include: {
          note: {
            include: {
              author: true,
              modifier: true,
              permissions: {
                where: {
                  userId: authorId,
                },
              },
            },
          },
        },
      });

      // Filtrer seulement les notes auxquelles l'utilisateur a accès
      const notes = noteFolders
        .filter((nf) => nf.note.permissions.length > 0)
        .map((nf) => ({
          id: nf.note.id,
          Titre: nf.note.Titre,
          Content: nf.note.Content,
          author: nf.note.author ? nf.note.author.pseudo : null,
          modifier: nf.note.modifier ? nf.note.modifier.pseudo : null,
          ModifiedAt: nf.note.ModifiedAt,
          userRole: nf.note.permissions[0]?.role || null,
        }));

      return res.status(200).json({ 
        folder: { 
          ...folder, 
          noteCount: notes.length 
        },
        notes 
      });
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

      await prisma.folder.update({ where: { id }, data: { deletedAt: new Date() } });
      return res.status(200).json({ message: "Dossier supprimé avec succès" });
    } catch (error) {
      console.error("[deleteFolder] Error:", error);
      return res.status(500).json({ message: "Erreur lors de la suppression du dossier", error: error.message });
    }
  },
};