/**
 * Middleware d'authentification pour vérifier les sessions
 */

/**
 * Vérifie si l'utilisateur est authentifié via sa session
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
export const requireAuth = (req, res, next) => {
    console.log('🔐 RequireAuth: Vérification authentification');
    console.log('Session actuelle:', req.session);
  
    if (!req.session.userId) {
        return res.status(401).json({ 
            message: 'Authentification requise',
            authenticated: false 
        });
    }
  
    // Ajouter les infos utilisateur dans req pour les contrôleurs
    req.userId = req.session.userId;
    next();
};

/**
 * Middleware pour vérifier si l'utilisateur possède une note
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express  
 * @param {Function} next - Fonction next d'Express
 */
export const requireNoteOwnership = async (req, res, next) => {
    const { id } = req.params;
    
    if (!req.session.userId) {
        return res.status(401).json({ message: "Pas authentifié" });
    }

    console.log('=== DEBUGGING OWNERSHIP CHECK ===');
    console.log('Note ID from params:', id, 'Type:', typeof id);
    console.log('User ID from session:', req.session.userId, 'Type:', typeof req.session.userId);
    console.log('Full session:', req.session);

    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // D'abord, vérifions si la note existe
        const noteExists = await prisma.note.findUnique({
            where: { id: id }
        });
        
        console.log('Note exists:', noteExists ? 'YES' : 'NO');
        if (noteExists) {
            console.log('Note details:', {
                id: noteExists.id,
                authorId: noteExists.authorId,
                authorIdType: typeof noteExists.authorId
            });
        }
        
        // Ensuite, cherchons avec les critères complets
        // Convertir userId en Int si c'est une string
        const sessionUserId = parseInt(req.session.userId);
        console.log('Converted session userId:', sessionUserId, 'Type:', typeof sessionUserId);
        
        const note = await prisma.note.findFirst({
            where: {
                id: id,
                authorId: sessionUserId // Utiliser la version convertie
            }
        });

        console.log('Ownership check result:', note ? 'AUTHORIZED' : 'DENIED');

        if (!note) {
            console.log('=== OWNERSHIP DENIED ===');
            return res.status(403).json({ 
                message: 'Accès refusé : note introuvable ou vous n\'en êtes pas le propriétaire',
                debug: {
                    noteId: id,
                    sessionUserId: req.session.userId,
                    convertedUserId: sessionUserId,
                    noteExists: !!noteExists,
                    noteAuthorId: noteExists?.authorId
                }
            });
        }

        req.note = note;
        next();
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la vérification des droits', 
            error: error.message 
        });
    }
};