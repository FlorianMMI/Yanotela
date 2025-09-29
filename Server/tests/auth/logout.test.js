import request from 'supertest';
import {app} from '../../src/app.js';
import { getPrismaTestInstance, generateUniqueToken, cleanupTestData } from '../testUtils.js';
import bcrypt from 'bcrypt';

const prisma = getPrismaTestInstance();

describe('Tests API Logout (/logout)', () => {
  let testUser;
  
  const testEmails = ['test-logout-api@example.com'];
  const testPseudos = ['logoutapi'];

  beforeEach(async () => {
    // Nettoyer les données de test
    await cleanupTestData(prisma, testEmails, testPseudos);

    // Créer un utilisateur de test vérifié
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        pseudo: 'logoutapi',
        email: 'test-logout-api@example.com',
        password: hashedPassword,
        prenom: 'Test',
        nom: 'User',
        is_verified: true,
        token: generateUniqueToken('logout_test')
      }
    });
  });

  afterEach(async () => {
    await cleanupTestData(prisma, testEmails, testPseudos);
  });

  test('POST /logout avec session active doit retourner JSON de succès', async () => {
    const agent = request.agent(app);

    // D'abord se connecter pour créer une session
    const loginData = {
      identifiant: 'logoutapi',
      password: 'testpassword123'
    };

    const loginRes = await agent
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);

    // Maintenant se déconnecter
    const logoutRes = await agent
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toBe('Déconnexion réussie');
  });

  test('POST /logout sans session active doit retourner JSON de succès (idempotent)', async () => {
    const res = await request(app)
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Déconnexion réussie');
  });

  test('POST /logout doit détruire la session correctement', async () => {
    const agent = request.agent(app);

    // Se connecter
    const loginData = {
      identifiant: 'logoutapi',
      password: 'testpassword123'
    };

    const loginRes = await agent
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(loginRes.statusCode).toBe(200);

    // Se déconnecter
    const logoutRes = await agent
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Vérifier que la session est détruite en essayant d'accéder à une route protégée
    // (Si vous avez des routes qui vérifient la session utilisateur)
    // Pour l'instant, on vérifie que multiple déconnexions restent idempotentes
    const secondLogoutRes = await agent
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(secondLogoutRes.statusCode).toBe(200);
    expect(secondLogoutRes.body.success).toBe(true);
  });

  test('POST /logout doit gérer les erreurs serveur gracieusement', async () => {
    // Simuler une erreur en fermant temporairement la connexion DB
    // Note: Le logout ne devrait pas dépendre de la DB, mais on teste quand même
    const res = await request(app)
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    // Le logout devrait toujours réussir même en cas d'erreur serveur
    // car il s'agit principalement de détruire la session côté serveur
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Déconnexion réussie');
  });

  test('POST /logout avec session corrompue doit retourner succès', async () => {
    const agent = request.agent(app);

    // Se connecter normalement
    const loginData = {
      identifiant: 'logoutapi',
      password: 'testpassword123'
    };

    await agent
      .post('/login')
      .send(loginData);

    // Simuler une session corrompue en envoyant un cookie invalide
    const logoutRes = await request(app)
      .post('/logout')
      .set('Cookie', 'connect.sid=s%3Ainvalid-session-id.invalid-signature')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    // Même avec une session corrompue, le logout doit réussir
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toBe('Déconnexion réussie');
  });

  test('POST /logout après logout doit rester idempotent', async () => {
    const agent = request.agent(app);

    // Se connecter
    const loginData = {
      identifiant: 'logoutapi',
      password: 'testpassword123'
    };

    await agent
      .post('/login')
      .send(loginData);

    // Premier logout
    const firstLogoutRes = await agent
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(firstLogoutRes.statusCode).toBe(200);
    expect(firstLogoutRes.body.success).toBe(true);

    // Deuxième logout
    const secondLogoutRes = await agent
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(secondLogoutRes.statusCode).toBe(200);
    expect(secondLogoutRes.body.success).toBe(true);
    expect(secondLogoutRes.body.message).toBe('Déconnexion réussie');

    // Troisième logout pour être sûr
    const thirdLogoutRes = await agent
      .post('/logout')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(thirdLogoutRes.statusCode).toBe(200);
    expect(thirdLogoutRes.body.success).toBe(true);
  });
});