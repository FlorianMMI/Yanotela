import { PrismaClient } from '@prisma/client';



// Test de connexion à la base de données
describe('Test de connexion à la base de données', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('devrait pouvoir se connecter à la base de données', async () => {
    // Test de connexion basique
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].test).toBe(1);
  });
});