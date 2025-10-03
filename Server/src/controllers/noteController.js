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


import {PrismaClient} from "@prisma/client";
import crypto from "crypto";
import {getPermission} from "./permissionController.js";

const prisma = new PrismaClient();

export const noteController = {

    getNotes: async (req, res) => {
        console.log('Session data:', req.session); // Debug log
        
        // Vérifier l'authentification
        if (!req.session.userId) {
            console.log('User not authenticated - session userId missing');
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }

        try {
                // Récupérer toutes les notes où l'utilisateur a des permissions
            const permissions = await prisma.permission.findMany({
                where: {
                    userId: req.session.userId
                },
                include: {
                    note: true
                }
            });

            // Extraire les notes et ajouter le rôle de l'utilisateur
            const notes = permissions.map(perm => ({
                ...perm.note,
                userRole: perm.role // Ajouter le rôle pour le front
            }));

            // Trier par date de modification
            notes.sort((a, b) => new Date(b.ModifiedAt) - new Date(a.ModifiedAt));

            const totalNotes = notes.length;

            res.status(200).json({ notes, totalNotes });
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des notes', error: error.message });
        }
    },

    createNote: async (req, res) => {
        // Vérifier si l'utilisateur est authentifié via la session
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        
        if (!req.body) {
            return res.status(400).json({ message: 'Aucune donnée reçue dans req.body' });
        }

        if(req.body == {} ||req.body == null || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Aucune donnée reçue dans req.body' });
        }

        const { Titre, Content } = req.body;
        // Récupérer l'authorId depuis la session au lieu du body
        const authorId = parseInt(req.session.userId); // Convertir en Int pour la DB

        if (!Titre) {
            return res.status(400).json({ message: 'Titre requis' });
        }

        try {
            // Générer un UUID plus simple et fiable
            const UID = crypto.randomBytes(8).toString('hex'); // 16 characters
            console.log("Generated UID:", UID);

            const note = await prisma.note.create({
                data: {
                    id: UID,
                    Titre,
                    Content,
                    authorId,
                    permissions: {
                        create: {
                            userId: authorId,
                            role: 0 // Rôle 0 = Propriétaire
                        }
                    }
                }
            });

            res.status(201).json({ 
                message: 'Note créée avec succès', 
                note, 
                redirectUrl: `/notes/${note.id}` 
            });
        }

        catch (error) {
            console.error('Erreur lors de la création de la note:', error);
            res.status(500).json({ message: 'Erreur lors de la création de la note', error: error.message });
        }
    },
    
    getNoteById: async (req, res) => {
        const { id } = req.params;
        const { userId } = req.session;
        
        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        
        try {
            const note = await prisma.note.findUnique({
                where: { id: id },
            });
            
            if (!note) {
                return res.status(404).json({ message: 'Note non trouvée' });
            }

            // Récupérer le rôle de l'utilisateur sur cette note
            const userPermission = await getPermission(userId, id);
            
            if (!userPermission) {
                return res.status(403).json({ message: 'Vous n\'avez pas accès à cette note' });
            }

            res.status(200).json({ 
                Titre: note.Titre, 
                Content: note.Content,
                userRole: userPermission.role // Ajouter le rôle pour le front
            });
        }
        catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération de la note', error: error.message });
        }
    },
    
    updateNoteById: async (req, res) => {
        const { id } = req.params;
        let { Titre, Content } = req.body;

        const { userId } = req.session;
        
        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        
        if (!Titre || !Content) {
            return res.status(400).json({ message: 'Champs requis manquants' });
        }

        if (Titre === ""){
            Titre = "Sans titre";
        }

        try {
            // Vérifier les permissions (await car async)
            const userPermission = await getPermission(userId, id);
            
            if (!userPermission) {
                return res.status(403).json({ message: 'Vous n\'avez pas accès à cette note' });
            }
            
            // Seuls propriétaire (0), admin (1) et éditeur (2) peuvent modifier
            if (userPermission.role > 2) {
                return res.status(403).json({ message: 'Vous n\'avez pas la permission de modifier cette note (lecture seule)' });
            }

            const note = await prisma.note.update({
                where: { id: id },
                data: { Titre, Content, ModifiedAt: new Date() },
            });
            res.status(200).json({ message: 'Note mise à jour avec succès', note });
        }
        catch (error) {
            console.error('Erreur lors de la mise à jour de la note:', error);
            res.status(500).json({ message: 'Erreur lors de la mise à jour de la note', error: error.message });
        }
    },

}