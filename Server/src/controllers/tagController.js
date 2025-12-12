import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupère tous les tags d'un utilisateur
 */
export const getUserTags = async (req, res) => {
  try {
    const userId = req.userId;

    const tags = await prisma.tag.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tags'
    });
  }
};

/**
 * Crée un nouveau tag
 */
export const createTag = async (req, res) => {
  try {
    const userId = req.userId;
    const { nom, couleur } = req.body;

    if (!nom || !couleur) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et la couleur sont requis'
      });
    }

    // Vérifier si un tag avec ce nom existe déjà pour cet utilisateur
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId: userId,
        nom: nom.trim()
      }
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Un tag avec ce nom existe déjà'
      });
    }

    const tag = await prisma.tag.create({
      data: {
        nom: nom.trim(),
        couleur: couleur.trim(),
        userId: userId
      }
    });

    res.json({
      success: true,
      tag
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du tag'
    });
  }
};

/**
 * Met à jour un tag existant
 */
export const updateTag = async (req, res) => {
  try {
    const userId = req.userId;
    const { tagId } = req.params;
    const { nom, couleur } = req.body;

    if (!nom || !couleur) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et la couleur sont requis'
      });
    }

    // Vérifier que le tag appartient à l'utilisateur
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trouvé'
      });
    }

    if (tag.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas la permission de modifier ce tag'
      });
    }

    // Vérifier si un autre tag avec ce nom existe déjà
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId: userId,
        nom: nom.trim(),
        id: { not: tagId }
      }
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Un autre tag avec ce nom existe déjà'
      });
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        nom: nom.trim(),
        couleur: couleur.trim()
      }
    });

    res.json({
      success: true,
      tag: updatedTag
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du tag'
    });
  }
};

/**
 * Supprime un tag
 */
export const deleteTag = async (req, res) => {
  try {
    const userId = req.userId;
    const { tagId } = req.params;

    // Vérifier que le tag appartient à l'utilisateur
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trouvé'
      });
    }

    if (tag.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas la permission de supprimer ce tag'
      });
    }

    // Supprimer le tag (les notes avec ce tag auront automatiquement tagId = null grâce à onDelete: SetNull)
    await prisma.tag.delete({
      where: { id: tagId }
    });

    res.json({
      success: true,
      message: 'Tag supprimé avec succès'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du tag'
    });
  }
};
