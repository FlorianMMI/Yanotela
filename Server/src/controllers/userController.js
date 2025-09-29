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
            // Récupérer les informations de l'utilisateur connecté
            const user = await prisma.user.findUnique({
                where: {
                    id: parseInt(req.session.userId, 10) // Convertir en Int pour la DB (base 10)
                },
                select: {
                    id: true,
                    pseudo: true,
                    prenom: true,
                    nom: true,
                    email: true
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des informations utilisateur', error: error.message });
        }
    }

}