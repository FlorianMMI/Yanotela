import { PrismaClient } from '@prisma/client';

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
    console.warn('Erreur lors du nettoyage des données de test:', error.message);
  }
}