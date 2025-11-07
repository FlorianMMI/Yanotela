/**
 * Script de test rapide pour vérifier le champ yjsState
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {

  try {
    // 1. Trouver une note existante
    const note = await prisma.note.findFirst({
      select: {
        id: true,
        Titre: true,
        Content: true,
        yjsState: true
      }
    });

    if (!note) {
      
      return;
    }

    // 2. Tester l'écriture d'un yjsState
    
    const testBuffer = Buffer.from([1, 2, 3, 4, 5]);
    
    await prisma.note.update({
      where: { id: note.id },
      data: { yjsState: testBuffer }
    });

    // 3. Relire pour vérifier
    const updated = await prisma.note.findUnique({
      where: { id: note.id },
      select: { yjsState: true }
    });

    if (updated && updated.yjsState) {
      
      console.log(`   Contenu: [${Array.from(updated.yjsState).join(', ')}]`);
    } else {
      
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('yjsState')) {

    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
