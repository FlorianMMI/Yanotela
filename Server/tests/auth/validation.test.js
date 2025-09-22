import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Tests de validation d\'email', () => {
  let testUser;
  let validationToken;

  beforeEach(async () => {
    // Nettoyer d'abord
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-validation@example.com' },
          { pseudo: 'validationuser' }
        ]
      }
    });

    // Créer un utilisateur non vérifié avec un token
    validationToken = 'test-validation-token-12345';
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        pseudo: 'validationuser',
        email: 'test-validation@example.com',
        password: hashedPassword,
        prenom: 'Test',
        nom: 'User',
        is_verified: false,
        token: validationToken
      }
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-validation@example.com' },
          { pseudo: 'validationuser' }
        ]
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /validate/:token avec token valide doit valider le compte', async () => {
    const res = await request(app)
      .get(`/validate/${validationToken}`);

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');

    // Vérifier que l'utilisateur est maintenant vérifié
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });

    expect(updatedUser.is_verified).toBe(true);
    expect(updatedUser.token).toContain('VALIDATED_');
  });

  test('GET /validate/:token avec token invalide doit échouer', async () => {
    const invalidToken = 'token-inexistant-12345';

    const res = await request(app)
      .get(`/validate/${invalidToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('Lien invalide, expiré ou déjà utilisé');
  });

  test('GET /validate/:token avec token déjà utilisé doit échouer', async () => {
    // D'abord valider le compte
    await request(app)
      .get(`/validate/${validationToken}`);

    // Essayer de valider à nouveau avec le même token
    const res = await request(app)
      .get(`/validate/${validationToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('Lien invalide, expiré ou déjà utilisé');
  });

  test('Validation doit créer une session utilisateur', async () => {
    const agent = request.agent(app);

    const res = await agent
      .get(`/validate/${validationToken}`);

    expect(res.statusCode).toBe(302);

    // Vérifier que l'utilisateur est maintenant connecté en accédant à la page d'accueil
    const homeRes = await agent
      .get('/');

    expect(homeRes.statusCode).toBe(200);
  });

  test('Validation avec token vide doit échouer', async () => {
    const res = await request(app)
      .get('/validate/');

    expect(res.statusCode).toBe(404);
  });

  test('Validation doit préserver les données utilisateur', async () => {
    await request(app)
      .get(`/validate/${validationToken}`);

    const validatedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });

    expect(validatedUser.pseudo).toBe(testUser.pseudo);
    expect(validatedUser.email).toBe(testUser.email);
    expect(validatedUser.prenom).toBe(testUser.prenom);
    expect(validatedUser.nom).toBe(testUser.nom);
    expect(validatedUser.password).toBe(testUser.password);
  });
});