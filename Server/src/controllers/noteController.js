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