import request from 'supertest';
import app from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tests d\'inscription (Register)', () => {
  // Nettoyer la base de données avant chaque test
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-register@example.com' },
          { pseudo: 'testuser' }
        ]
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /register doit afficher la page d\'inscription', async () => {
    const res = await request(app).get('/register');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('register'); // Vérifier que c'est bien la page d'inscription
  });

  test('POST /register avec données valides doit créer un utilisateur', async () => {
    const userData = {
      pseudo: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test-register@example.com',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/register')
      .send(userData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Compte créé avec succès');

    // Vérifier que l'utilisateur a été créé en base
    const user = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    expect(user).toBeTruthy();
    expect(user.pseudo).toBe(userData.pseudo);
    expect(user.is_verified).toBe(false);
  });

  test('POST /register avec email déjà utilisé doit échouer', async () => {
    // Créer d'abord un utilisateur
    const existingUser = {
      pseudo: 'existinguser',
      firstName: 'Existing',
      lastName: 'User',
      email: 'test-register@example.com',
      password: 'password123'
    };

    await request(app).post('/register').send(existingUser);

    // Essayer de créer un autre utilisateur avec le même email
    const duplicateUser = {
      pseudo: 'newuser',
      firstName: 'New',
      lastName: 'User',
      email: 'test-register@example.com',
      password: 'password456'
    };

    const res = await request(app)
      .post('/register')
      .send(duplicateUser);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Cet email est déjà utilisé');
  });

  test('POST /register avec pseudo déjà utilisé doit échouer', async () => {
    // Créer d'abord un utilisateur
    const existingUser = {
      pseudo: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'existing@example.com',
      password: 'password123'
    };

    await request(app).post('/register').send(existingUser);

    // Essayer de créer un autre utilisateur avec le même pseudo
    const duplicateUser = {
      pseudo: 'testuser',
      firstName: 'Another',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password456'
    };

    const res = await request(app)
      .post('/register')
      .send(duplicateUser);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Ce pseudo est déjà utilisé');
  });

  test('POST /register avec données invalides doit échouer', async () => {
    const invalidData = {
      pseudo: 'ab', // Trop court
      firstName: 'A', // On peut tester aussi des firstNames courts
      lastName: 'B', // On peut tester aussi des lastNames courts
      email: 'invalid-email', // Email invalide
      password: '12' // Trop court
    };

    const res = await request(app)
      .post('/register')
      .send(invalidData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Le pseudo doit avoir au moins 3 caractères');
  });

  test('POST /register avec pseudo contenant des caractères spéciaux doit échouer', async () => {
    const invalidData = {
      pseudo: 'test@user!',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .send(invalidData);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Le pseudo ne doit contenir que des caractères alphanumériques');
  });
});