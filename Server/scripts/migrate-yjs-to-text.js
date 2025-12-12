/**
 * Script de migration : Convertir les notes stockées en base64 Yjs vers texte brut
 * 
 * Usage: node scripts/migrate-yjs-to-text.js
 */

import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';

const prisma = new PrismaClient();

async function migrateNotes() {

  try {
    // Récupérer toutes les notes
    const notes = await prisma.note.findMany({
      select: {
        id: true,
        Titre: true,
        Content: true
      }
    });

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const note of notes) {
      if (!note.Content) {
        skipped++;
        continue;
      }

      // Détecter si c'est du base64 Yjs
      const looksLikeBase64Yjs = /^[A-Za-z0-9+/=]{50,}$/.test(note.Content.substring(0, 100));

      if (!looksLikeBase64Yjs) {
        skipped++;
        continue;
      }

      try {
        
        // Décoder le base64 Yjs
        const binary = Buffer.from(note.Content, 'base64');
        const doc = new Y.Doc();
        Y.applyUpdate(doc, binary);
        
        // Extraire le texte
        const yText = doc.getText('content');
        const textContent = yText.toString();

        // Sauvegarder le texte
        await prisma.note.update({
          where: { id: note.id },
          data: { Content: textContent }
        });

        migrated++;

      } catch (error) {
        
        errors++;
      }
    }

  } catch (error) {
    
  } finally {
    await prisma.$disconnect();
  }
}

migrateNotes();
