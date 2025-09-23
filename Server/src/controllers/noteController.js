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
const prisma = new PrismaClient();




export const noteController = {

    getNotes: async (req, res) => {
        try {
            const notes = await prisma.note.findMany();
            res.status(200).json(notes);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des notes', error: error.message });
        }
    },

    createNote: async (req, res) => {

        
       
        if (!req.body) {
            return res.status(400).json({ message: 'Aucune donnée reçue dans req.body' });
        }

        if(req.body == {} ||req.body == null || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Aucune donnée reçue dans req.body' });
        }




        const { Titre, Content, authorId } = req.body;

        if (!Titre || !Content || !authorId) {
            return res.status(500).json({ message: 'Champs requis manquants' });
        }

        try {
            
            const note = await prisma.note.create({
                data: {
                    Titre,
                    Content,
                    authorId
                }
            });
            res.status(201).json({ message: 'Note créée avec succès', note });
        }
        catch (error) {
            res.status(500).json({ message: 'Erreur lors de la création de la note', error: error.message });
        }
    }

    
    


}