/**
 * Script de nettoyage automatique des notes supprimées
 * Supprime définitivement les notes qui sont en corbeille depuis plus de 30 jours
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Durée de rétention en jours (modifiable)
const RETENTION_DAYS = 30;

async function cleanupDeletedNotes() {
  try {
    // Calculer la date limite (30 jours avant aujourd'hui)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    // Trouver les notes à supprimer définitivement
    const notesToDelete = await prisma.note.findMany({
      where: {
        deletedAt: {
          not: null,
          lte: cutoffDate, // deletedAt <= cutoffDate
        },
      },
      select: {
        id: true,
        Titre: true,
        deletedAt: true,
      },
    });

    if (notesToDelete.length === 0) {
      
      return;
    }

    notesToDelete.forEach((note) => {
      console.log(`   - ${note.Titre} (ID: ${note.id}, supprimée le ${note.deletedAt?.toLocaleDateString()})`);
    });

    // Supprimer les permissions liées (cascade)
    const noteIds = notesToDelete.map((n) => n.id);
    
    const deletedPermissions = await prisma.permission.deleteMany({
      where: {
        noteId: {
          in: noteIds,
        },
      },
    });
    console.log(`🔗 ${deletedPermissions.count} permission(s) supprimée(s)`);

    // Supprimer les relations NoteFolder (cascade)
    const deletedNoteFolders = await prisma.noteFolder.deleteMany({
      where: {
        noteId: {
          in: noteIds,
        },
      },
    });
    console.log(`📁 ${deletedNoteFolders.count} relation(s) note-dossier supprimée(s)`);

    // Supprimer définitivement les notes
    const result = await prisma.note.deleteMany({
      where: {
        id: {
          in: noteIds,
        },
      },
    });

    console.log(`✅ ${result.count} note(s) supprimée(s) définitivement`);
  } catch (error) {
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanupDeletedNotes()
  .then(() => {
    
    process.exit(0);
  })
  .catch((error) => {
    
    process.exit(1);
  });
