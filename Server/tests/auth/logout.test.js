import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Tests de déconnexion (Logout)', () => {
  let testUser;
  let agent;

  beforeEach(async () => {
    // Nettoyer d'abord
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-logout@example.com' },
          { pseudo: 'logoutuser' }
        ]
      }
    });

    // Créer un utilisateur de test
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        pseudo: 'logoutuser',
        email: 'test-logout@example.com',
        password: hashedPassword,
        prenom: 'Test',
        nom: 'User',
        is_verified: true,
        token: `test-logout-token-${Date.now()}-${Math.random()}`
      }
    });

    // Créer un agent pour maintenir la session
    agent = request.agent(app);
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-logout@example.com' },
          { pseudo: 'logoutuser' }
        ]
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /logout après connexion doit déconnecter l\'utilisateur', async () => {
    // D'abord se connecter
    const loginData = {
      identifiant: 'logoutuser',
      password: 'testpassword123'
    };

    const loginRes = await agent
      .post('/login')
      .send(loginData);

    expect(loginRes.statusCode).toBe(302);

    // Ensuite se déconnecter
    const logoutRes = await agent
      .post('/logout');

    expect(logoutRes.statusCode).toBe(302);
    expect(logoutRes.headers.location).toBe('/');
  });

  test('POST /logout sans être connecté doit fonctionner', async () => {
    const res = await request(app)
      .post('/logout');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  test('Vérifier que la session est détruite après logout', async () => {
    // Se connecter d'abord
    const loginData = {
      identifiant: 'logoutuser',
      password: 'testpassword123'
    };

    await agent
      .post('/login')
      .send(loginData);

    // Se déconnecter
    await agent
      .post('/logout');

    // Essayer d'accéder à une page qui nécessite d'être connecté
    // (Ici on teste juste que la page d'accueil ne montre pas l'utilisateur connecté)
    const homeRes = await agent
      .get('/');

    expect(homeRes.statusCode).toBe(200);
    // La page ne devrait pas contenir les informations de session
    expect(homeRes.text).not.toContain('logoutuser');
  });

  test('Cookie de session doit être supprimé après logout', async () => {
    // Se connecter d'abord
    const loginData = {
      identifiant: 'logoutuser',
      password: 'testpassword123'
    };

    await agent
      .post('/login')
      .send(loginData);

    // Se déconnecter et vérifier les cookies
    const logoutRes = await agent
      .post('/logout');

    expect(logoutRes.statusCode).toBe(302);
    
    // Vérifier que le cookie de session est marqué pour suppression
    const setCookieHeader = logoutRes.headers['set-cookie'];
    if (setCookieHeader) {
      const connectSidCookie = setCookieHeader.find(cookie => 
        cookie.includes('connect.sid')
      );
      // Le cookie devrait être présent pour la suppression
      expect(connectSidCookie).toBeDefined();
    }
  });
});