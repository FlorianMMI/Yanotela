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
    return res.status(401).json({ message:"Pas authentifié"
     });
  }

  console.log('Vérification de la propriété pour la note ID:', req.session);

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(id),
        authorId: req.session.userId
      }
    });

    if (!note) {
      return res.status(403).json({ 
        message: 'Accès refusé : note introuvable ou vous n\'en êtes pas le propriétaire' 
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