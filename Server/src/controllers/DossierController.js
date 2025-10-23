import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DossierController = {
    // Créer un nouveau dossier
    createDossier: async (req, res) => {
        try {
            const { Nom, Description, CouleurTag } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            // Validation du nom
            if (!Nom || Nom.trim() === '') {
                return res.status(400).json({ error: 'Le nom du dossier est requis' });
            }

            // Convertir userId en Int pour Prisma
            const authorId = parseInt(userId);
            
            if (isNaN(authorId)) {
                return res.status(400).json({ error: 'ID utilisateur invalide' });
            }

            // Créer le dossier
            const newDossier = await prisma.dossier.create({
                data: {
                    Nom: Nom.trim(),
                    Description: Description?.trim() || null,
                    CouleurTag: CouleurTag || '#D4AF37',
                    authorId: authorId,
                },
            });

            res.status(201).json({ 
                message: 'Dossier créé avec succès',
                folder: newDossier 
            });
        } catch (error) {
            console.error('Erreur lors de la création du dossier:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({ 
                error: 'Erreur serveur lors de la création du dossier',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Récupérer tous les dossiers de l'utilisateur
    getDossiers: async (req, res) => {
        try {
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            // Convertir userId en Int
            const authorId = parseInt(userId);

            // Récupérer les dossiers avec le nombre de notes (à implémenter plus tard)
            const dossiers = await prisma.dossier.findMany({
                where: {
                    authorId: authorId,
                    deletedAt: null,
                },
                orderBy: {
                    ModifiedAt: 'desc',
                },
            });

            // Pour l'instant, noteCount sera 0 (relation notes à implémenter)
            const dossiersWithCount = dossiers.map(dossier => ({
                ...dossier,
                noteCount: 0,
            }));

            res.status(200).json({ 
                folders: dossiersWithCount,
                totalFolders: dossiersWithCount.length 
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la récupération des dossiers' });
        }
    },

    // Récupérer un dossier spécifique par ID
    getDossierById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Utilisateur non authentifié' });
            }

            // Convertir userId en Int
            const authorId = parseInt(userId);

            const dossier = await prisma.dossier.findFirst({
                where: {
                    id: id,
                    authorId: authorId,
                    deletedAt: null,
                },
            });

            if (!dossier) {
                return res.status(404).json({ error: 'Dossier introuvable' });
            }

            res.status(200).json({ 
                folder: {
                    ...dossier,
                    noteCount: 0, // À implémenter avec la relation notes
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du dossier:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la récupération du dossier' });
        }
    },

    // Mettre à jour un dossier
    updateDossier: async (req, res) => {
        try {
            const { id } = req.params;
            const { Nom, Description, CouleurTag } = req.body;
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

            // Validation du nom si fourni
            if (Nom !== undefined && Nom.trim() === '') {
                return res.status(400).json({ error: 'Le nom du dossier ne peut pas être vide' });
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