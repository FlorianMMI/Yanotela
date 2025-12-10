/**
 * Script pour créer une note de test
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNote() {

  try {
    // Trouver le premier utilisateur
    const user = await prisma.user.findFirst();

    if (!user) {
      
      return;
    }

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

  } catch (error) {
    
  } finally {
    await prisma.$disconnect();
  }
}

createTestNote();
