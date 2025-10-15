import { Prisma } from "@prisma/client";

export const DossierController = {
    createDossier: async (req, res) => {
        // Logique pour créer un dossier
        res.status(201).json({ message: 'Dossier créé avec succès' });
    },

    getDossier: async(req, res) => {
        
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        
        // Récupérer les dossiers de l'utilisateur authentifié
        const dossiers = await Prisma.dossier.findMany({
            where: {
                userId: req.user.id
            }
        });


        res.status(200).json({ message: 'Dossiers récupérés avec succès', data: dossiers });
    }
}