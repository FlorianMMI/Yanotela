/**
 * Script de test rapide pour vérifier le champ yjsState
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('🧪 Test du champ yjsState...\n');

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
      console.log('❌ Aucune note trouvée dans la base');
      return;
    }

    console.log(`📝 Note trouvée: ${note.id} - "${note.Titre}"`);
    console.log(`   Content: ${note.Content ? `${note.Content.substring(0, 50)}...` : 'null'}`);
    console.log(`   yjsState: ${note.yjsState ? `${note.yjsState.length} bytes` : 'null'}`);
    console.log('');

    // 2. Tester l'écriture d'un yjsState
    console.log('✏️  Test d\'écriture yjsState...');
    const testBuffer = Buffer.from([1, 2, 3, 4, 5]);
    
    await prisma.note.update({
      where: { id: note.id },
      data: { yjsState: testBuffer }
    });

    console.log('✅ Écriture réussie');

    // 3. Relire pour vérifier
    const updated = await prisma.note.findUnique({
      where: { id: note.id },
      select: { yjsState: true }
    });

    if (updated && updated.yjsState) {
      console.log(`✅ Lecture réussie: ${updated.yjsState.length} bytes`);
      console.log(`   Contenu: [${Array.from(updated.yjsState).join(', ')}]`);
    } else {
      console.log('❌ Lecture échouée');
    }

    console.log('\n✅ Test terminé avec succès !');
    console.log('   Le champ yjsState fonctionne correctement.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('yjsState')) {
      console.log('\n⚠️  Le champ yjsState n\'existe pas encore dans la base de données.');
      console.log('   Exécutez: npx prisma migrate dev --name add_yjs_state');
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
