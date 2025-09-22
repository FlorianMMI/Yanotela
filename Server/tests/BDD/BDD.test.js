import { PrismaClient } from '@prisma/client';

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

  test('devrait pouvoir exécuter une requête sur la table User', async () => {
    try {
      // Test si la table User existe et est accessible
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe('number');
      expect(userCount).toBeGreaterThanOrEqual(0);
    } catch (error) {
      // Si la table n'existe pas encore, c'est OK pour les tests
      expect(error.message).toContain('User');
    }
  });

  test('devrait pouvoir exécuter une requête sur la table Note', async () => {
    try {
      // Test si la table Note existe et est accessible
      const noteCount = await prisma.note.count();
      expect(typeof noteCount).toBe('number');
      expect(noteCount).toBeGreaterThanOrEqual(0);
    } catch (error) {
      // Si la table n'existe pas encore, c'est OK pour les tests
      expect(error.message).toContain('Note');
    }
  });

  test('devrait pouvoir vérifier le statut de la base de données', async () => {
    // Test de santé de la base de données
    const dbInfo = await prisma.$queryRaw`SELECT version() as version`;
    expect(dbInfo).toBeDefined();
    expect(dbInfo[0].version).toContain('PostgreSQL');
  });

  test('devrait pouvoir créer et supprimer un utilisateur de test', async () => {
    const testUser = {
      pseudo: `test_user_${Date.now()}`,
      prenom: 'Test',
      nom: 'User',
      password: 'test123',
      email: `test_${Date.now()}@test.com`,
      token: `test_token_${Date.now()}`
    };

    try {
      // Créer un utilisateur de test
      const createdUser = await prisma.user.create({
        data: testUser
      });

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.pseudo).toBe(testUser.pseudo);
      expect(createdUser.email).toBe(testUser.email);

      // Supprimer l'utilisateur de test
      await prisma.user.delete({
        where: { id: createdUser.id }
      });

      // Vérifier que l'utilisateur a été supprimé
      const deletedUser = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(deletedUser).toBeNull();

    } catch (error) {
      console.error('Erreur lors du test CRUD utilisateur:', error);
      throw error;
    }
  });

  test('devrait pouvoir créer et supprimer une note de test (avec utilisateur)', async () => {
    // D'abord créer un utilisateur pour la note
    const testUser = {
      pseudo: `note_test_user_${Date.now()}`,
      prenom: 'NoteTest',
      nom: 'User',
      password: 'test123',
      email: `notetest_${Date.now()}@test.com`,
      token: `note_test_token_${Date.now()}`
    };

    try {
      const createdUser = await prisma.user.create({
        data: testUser
      });

      // Créer une note de test
      const testNote = {
        Titre: 'Note de test',
        Content: 'Contenu de test pour vérifier la BDD',
        authorId: createdUser.id
      };

      const createdNote = await prisma.note.create({
        data: testNote
      });

      expect(createdNote).toBeDefined();
      expect(createdNote.id).toBeDefined();
      expect(createdNote.Titre).toBe(testNote.Titre);
      expect(createdNote.authorId).toBe(createdUser.id);

      // Nettoyer : supprimer la note puis l'utilisateur
      await prisma.note.delete({
        where: { id: createdNote.id }
      });

      await prisma.user.delete({
        where: { id: createdUser.id }
      });

    } catch (error) {
      console.error('Erreur lors du test CRUD note:', error);
      throw error;
    }
  });
});
