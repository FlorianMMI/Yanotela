/**
 * Contrôleur pour la gestion des utilisateurs.
 * 
 * Ce fichier fournit la fonction pour récupérer les informations
 * de l'utilisateur connecté depuis la base de données.
 * 
 * Utilise Prisma comme ORM pour interagir avec la base de données.
 * 
 * Fonction exportée :
 * - getUserInfo : Récupère les informations de l'utilisateur authentifié.
 */

import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

export const userController = {

    getUserInfo: async (req, res) => {
        
        
        // Vérifier l'authentification
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        
        try {
            const userId = parseInt(req.session.userId, 10);
            
            
            // Récupérer les informations de l'utilisateur connecté
            const user = await prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    id: true,
                    pseudo: true,
                    prenom: true,
                    nom: true,
                    email: true
                }
            });

            console.log('Utilisateur trouvé:', user);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Compter le nombre de notes de l'utilisateur
            const noteCount = await prisma.note.count({
                where: {
                    authorId: userId
                }
            });

            console.log('Nombre de notes:', noteCount);

            // Ajouter le nombre de notes aux informations utilisateur
            const userWithNoteCount = {
                ...user,
                noteCount
            };

            console.log('Réponse finale:', userWithNoteCount);
            
            return res.status(200).json(userWithNoteCount);
        } catch (error) {
            console.error('Erreur getUserInfo:', error);
            return res.status(500).json({ message: 'Erreur lors de la récupération des informations utilisateur', error: error.message });
        }
    },

    updateUserInfo: async (req, res) => {


        if (!req.session.userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }

        

        const userId = parseInt(req.session.userId, 10);
        const { pseudo, prenom, nom, email } = req.body;
 
        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { pseudo, prenom, nom, email },
                select: {
                    id: true,
                    pseudo: true,
                    prenom: true,
                    nom: true,
                    email: true
                }
            });
            
            return res.status(200).json(updatedUser);
        } catch (error) {
            console.error('Erreur updateUserInfo:', error);
            return res.status(500).json({ message: 'Erreur lors de la mise à jour des informations utilisateur', error: error.message });
        }
    }

}