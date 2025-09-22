import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

export const noteController = {

    createNote: async (req, res) => {

        console.log('Données reçues dans req.body:', req.body);
       
        if (!req.body) {
            return res.status(400).json({ message: 'Aucune donnée reçue dans req.body' });
        }

        const { Titre, Content, authorId } = req.body;

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