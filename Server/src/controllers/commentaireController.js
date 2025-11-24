import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const commentaireController = {
	// Créer un commentaire
	async createcommentaire(req, res) {
		try {
			const { text, authorId, date, idnote } = req.body;
			if (!text || !authorId || !date || !idnote) {
				return res.status(400).json({ error: 'Champs manquants' });
			}
			const commentaire = await prisma.commentaire.create({
				data: {
					text,
					authorId: Number(authorId),
					date: new Date(date),
					idnote,
				},
			});
			return res.status(201).json({ success: true, commentaire });
		} catch (err) {
			console.error('Erreur création commentaire:', err);
			return res.status(500).json({ error: 'Erreur serveur' });
		}
	},

	// Récupérer les commentaire d'une note
	async getcommentaireByNote(req, res) {
		try {
			const { noteId } = req.params;
			if (!noteId) {
				return res.status(400).json({ error: 'noteId manquant' });
			}
			const commentaire = await prisma.commentaire.findMany({
				where: { idnote: noteId },
				orderBy: { date: 'asc' },
				include: {
					author: { select: { pseudo: true } }
				}
			});
			return res.json({ commentaire });
		} catch (err) {
			console.error('Erreur récupération commentaire:', err);
			return res.status(500).json({ error: 'Erreur serveur' });
		}
	},
};
