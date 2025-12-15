import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupère les préférences de notification d'un utilisateur
 * Retourne tous les types de notifications avec leur état (app/mail enabled)
 * Si aucune préférence n'existe pour un type, crée avec les valeurs par défaut (tout activé)
 * 
 * @route GET /notification-preference/get
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer tous les types de notifications actifs
    const allTypes = await prisma.notificationType.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    
    console.log('📋 Types:', allTypes.map(t => `${t.code} (${t.name})`).join(', '));

    // Récupérer les préférences existantes de l'utilisateur
    const existingPrefs = await prisma.userNotificationPreference.findMany({
      where: { userId },
      include: { notificationType: true },
    });

    // Créer un map des préférences existantes par code de notification
    const prefsMap = new Map();
    existingPrefs.forEach(pref => {
      prefsMap.set(pref.notificationType.code, pref);
    });

    // Construire la réponse avec tous les types
    const preferences = [];
    for (const type of allTypes) {
      const existingPref = prefsMap.get(type.code);
      
      if (existingPref) {
        // Préférence existe déjà
        preferences.push({
          id: existingPref.id,
          code: type.code,
          name: type.name,
          description: type.description,
          appEnabled: existingPref.appEnabled,
          mailEnabled: existingPref.mailEnabled,
        });
      } else {
        // Créer la préférence avec valeurs par défaut
        const newPref = await prisma.userNotificationPreference.create({
          data: {
            userId,
            notificationTypeId: type.id,
            appEnabled: true,
            mailEnabled: true,
          },
        });

        preferences.push({
          id: newPref.id,
          code: type.code,
          name: type.name,
          description: type.description,
          appEnabled: newPref.appEnabled,
          mailEnabled: newPref.mailEnabled,
        });
      }
    }

    res.status(200).json(preferences);
  } catch (error) {
    
    res.status(500).json({ error: 'Erreur lors de la récupération des préférences' });
  }
};

/**
 * Met à jour les préférences de notification d'un utilisateur
 * 
 * @route PUT /notification-preference/update
 * @body Array<{ code: string, appEnabled: boolean, mailEnabled: boolean }>
 * 
 * Exemple:
 * [
 *   { code: "INVITATION", appEnabled: true, mailEnabled: false },
 *   { code: "REMOVED", appEnabled: false, mailEnabled: true }
 * ]
 */
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const updates = req.body; // Array de { code, appEnabled, mailEnabled }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Le corps de la requête doit être un tableau' });
    }

    const updatedPrefs = [];

    for (const update of updates) {
      const { code, appEnabled, mailEnabled } = update;

      // Trouver le type de notification par son code
      const notifType = await prisma.notificationType.findUnique({
        where: { code },
      });

      if (!notifType) {
        
        continue;
      }

      // Mettre à jour ou créer la préférence
      const pref = await prisma.userNotificationPreference.upsert({
        where: {
          userId_notificationTypeId: {
            userId,
            notificationTypeId: notifType.id,
          },
        },
        update: {
          appEnabled: appEnabled ?? true,
          mailEnabled: mailEnabled ?? true,
        },
        create: {
          userId,
          notificationTypeId: notifType.id,
          appEnabled: appEnabled ?? true,
          mailEnabled: mailEnabled ?? true,
        },
      });

      updatedPrefs.push(pref);
    }

    res.status(200).json({ 
      message: 'Préférences mises à jour avec succès',
      count: updatedPrefs.length 
    });
  } catch (error) {
    
    res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences' });
  }
};

export default {
  getPreferences,
  updatePreferences,
};
