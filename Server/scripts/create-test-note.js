/**
 * Script pour créer une note de test
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNote() {
  console.log('📝 Création d\'une note de test...\n');

  try {
    // Trouver le premier utilisateur
    const user = await prisma.user.findFirst();

    if (!user) {
      console.log('❌ Aucun utilisateur trouvé. Créez un utilisateur d\'abord.');
      return;
    }

    console.log(`👤 Utilisateur: ${user.pseudo} (ID: ${user.id})`);

    // Créer une note de test simple
    const lexicalContent = JSON.stringify({
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Ceci est une note de test pour Yjs",
                type: "text",
                version: 1
              }
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1
          }
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
      }
    });

    const note = await prisma.note.create({
      data: {
        Titre: `Note test Yjs - ${new Date().toLocaleTimeString()}`,
        Content: lexicalContent,
        authorId: user.id
      }
    });

    console.log(`\n✅ Note créée avec succès !`);
    console.log(`   ID: ${note.id}`);
    console.log(`   Titre: ${note.Titre}`);
    console.log(`   URL: http://localhost:3000/notes/${note.id}`);
    console.log(`\n📋 Copiez cette URL pour tester l'éditeur`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNote();
