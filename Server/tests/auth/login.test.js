import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Tests de connexion (Login)', () => {
  let testUser;

  // Créer un utilisateur de test avant chaque test
  beforeEach(async () => {
    // Nettoyer d'abord
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-login@example.com' },
          { pseudo: 'loginuser' }
        ]
      }
    });

    // Créer un utilisateur de test vérifié
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        pseudo: 'loginuser',
        email: 'test-login@example.com',
        password: hashedPassword,
        prenom: 'Test',
        nom: 'User',
        is_verified: true,
        token: `test-login-token-${Date.now()}-${Math.random()}`
      }
    });
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-login@example.com' },
          { pseudo: 'loginuser' }
        ]
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /login avec pseudo et mot de passe corrects doit réussir', async () => {
    const loginData = {
      identifiant: 'loginuser',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(302); // Redirection après succès
    expect(res.headers.location).toBe('/');
  });

  test('POST /login avec email et mot de passe corrects doit réussir', async () => {
    const loginData = {
      identifiant: 'test-login@example.com',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(302); // Redirection après succès
    expect(res.headers.location).toBe('/');
  });

  test('POST /login avec identifiant inexistant doit échouer', async () => {
    const loginData = {
      identifiant: 'inexistant',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Utilisateur non trouvé');
  });

  test('POST /login avec mot de passe incorrect doit échouer', async () => {
    const loginData = {
      identifiant: 'loginuser',
      password: 'mauvaispassword'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Mot de passe incorrect');
  });

  test('POST /login avec compte non vérifié doit échouer', async () => {
    // Créer un utilisateur non vérifié
    const hashedPassword = await bcrypt.hash('password123', 10);
    const uniqueId = `${Date.now()}-${Math.random()}`;
    await prisma.user.create({
      data: {
        pseudo: `unverifieduser-${uniqueId}`,
        email: `unverified-${uniqueId}@example.com`,
        password: hashedPassword,
        prenom: 'Unverified',
        nom: 'User',
        is_verified: false,
        token: `unverified-token-${uniqueId}`
      }
    });

    const loginData = {
      identifiant: `unverifieduser-${uniqueId}`,
      password: 'password123'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Compte non activé');

    // Nettoyer
    await prisma.user.delete({
      where: { pseudo: `unverifieduser-${uniqueId}` }
    });
  });

  test('POST /login sans identifiant doit échouer', async () => {
    const loginData = {
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Identifiant et mot de passe requis');
  });

  test('POST /login sans mot de passe doit échouer', async () => {
    const loginData = {
      identifiant: 'loginuser'
    };

    const res = await request(app)
      .post('/login')
      .type('form')
      .send(loginData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Identifiant et mot de passe requis');
  });
});