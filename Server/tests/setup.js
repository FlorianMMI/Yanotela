import { cleanupPrisma } from './testUtils.js';

// Nettoyer après tous les tests
afterAll(async () => {
  await cleanupPrisma();
});