import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

let prisma = null;

// Fonction pour obtenir l'instance Prisma partagée
export function getPrismaTestInstance() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Fonction pour nettoyer après tous les tests
export async function cleanupPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Helper pour générer des tokens uniques
export function generateUniqueToken(testName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${testName}_${timestamp}_${random}`;
}

// Helper pour nettoyer les données de test
export async function cleanupTestData(prismaInstance, emails = [], pseudos = []) {
  try {
    await prismaInstance.user.deleteMany({
      where: {
        OR: [
          ...emails.map(email => ({ email })),
          ...pseudos.map(pseudo => ({ pseudo }))
        ]
      }
    });
  } catch (error) {
    
  }
}

// Helper pour créer un utilisateur de test unique avec des données générées
export async function createTestUser(prismaInstance, baseName = 'testuser') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueSuffix = `${timestamp}${random}`;

  // Default plaintext password used across tests
  const plainPassword = 'password123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const userData = {
    pseudo: `${baseName}_${uniqueSuffix}`,
    prenom: 'Test',
    nom: 'User',
    email: `${baseName}_${uniqueSuffix}@example.com`,
    password: hashedPassword,
    token: `token_${uniqueSuffix}`,
    is_verified: true
  };

  const user = await prismaInstance.user.create({ data: userData });
  return { user, userData, plainPassword };
}

// Helper pour nettoyer un utilisateur spécifique et ses données associées
export async function cleanupUser(prismaInstance, userId) {
  try {
    // Supprimer dans l'ordre des dépendances
    await prismaInstance.noteFolder.deleteMany({ where: { id_user: userId } });
    await prismaInstance.permission.deleteMany({ where: { userId } });
    await prismaInstance.folder.deleteMany({ where: { authorId: userId } });
    await prismaInstance.note.deleteMany({ where: { authorId: userId } });
    await prismaInstance.user.delete({ where: { id: userId } });
  } catch (error) {
    
  }
}