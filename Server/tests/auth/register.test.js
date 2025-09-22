import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tests d\'inscription (Register)', () => {
  beforeEach(async () => {
    // Nettoyer la DB avant chaque test
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { pseudo: 'testuser' },
          { email: 'existing@example.com' },
          { pseudo: 'existinguser' }
        ]
      }
    });
  });

  afterAll(async () => {
    // Nettoyer après tous les tests
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { pseudo: 'testuser' },
          { email: 'existing@example.com' },
          { pseudo: 'existinguser' }
        ]
      }
    });
    await prisma.$disconnect();
  });

  test('POST /register avec données valides doit créer un utilisateur', async () => {
    const userData = {
      pseudo: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .type('form')
      .send(userData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Compte créé avec succès');
  });

  test('POST /register avec email déjà existant doit échouer', async () => {
    // Créer d'abord un utilisateur
    await prisma.user.create({
      data: {
        pseudo: 'existinguser',
        prenom: 'Existing',
        nom: 'User',
        email: 'existing@example.com',
        password: 'hashedpassword',
        token: 'sometoken',
        is_verified: false
      }
    });

    const userData = {
      pseudo: 'newuser',
      firstName: 'New',
      lastName: 'User',
      email: 'existing@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .type('form')
      .send(userData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Cet email est déjà utilisé');
  });
});