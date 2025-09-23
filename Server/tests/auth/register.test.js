import request from 'supertest';
import app from '../../src/app.js';
import { getPrismaTestInstance, generateUniqueToken, cleanupTestData } from '../testUtils.js';

const prisma = getPrismaTestInstance();

describe('Tests API Register (/register)', () => {
  const testEmails = [
    'test-api@example.com',
    'existing-api@example.com', 
    'token-test@example.com'
  ];
  const testPseudos = [
    'testapi',
    'existingapi',
    'tokentest'
  ];

  beforeEach(async () => {
    // Nettoyer les données de test
    await cleanupTestData(prisma, testEmails, testPseudos);
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await cleanupTestData(prisma, testEmails, testPseudos);
  });

  test('POST /register avec données valides doit créer un utilisateur et retourner JSON', async () => {
    const userData = {
      pseudo: 'testapi',
      firstName: 'Test',
      lastName: 'User',
      email: 'test-api@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Compte créé avec succès');
    expect(res.body.user).toMatchObject({
      pseudo: 'testapi',
      email: 'test-api@example.com'
    });
    expect(res.body.user.id).toBeDefined();

    // Vérifier que l'utilisateur est bien créé en DB
    const userInDb = await prisma.user.findUnique({
      where: { email: 'test-api@example.com' }
    });
    expect(userInDb).toBeTruthy();
    expect(userInDb.pseudo).toBe('testapi');
    expect(userInDb.is_verified).toBe(false);
    expect(userInDb.token).toBeTruthy();
  });

  test('POST /register avec email déjà existant doit retourner une erreur JSON', async () => {
    // Créer d'abord un utilisateur
    await prisma.user.create({
      data: {
        pseudo: 'existingapi',
        prenom: 'Existing',
        nom: 'User',
        email: 'existing-api@example.com',
        password: 'hashedpassword',
        token: 'sometoken',
        is_verified: false
      }
    });

    const userData = {
      pseudo: 'newapi',
      firstName: 'New',
      lastName: 'User',
      email: 'existing-api@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Cet email est déjà utilisé.');
    expect(res.body.success).toBeUndefined();
  });

  test('POST /register avec pseudo déjà existant doit retourner une erreur JSON', async () => {
    // Créer d'abord un utilisateur
    await prisma.user.create({
      data: {
        pseudo: 'existingapi',
        prenom: 'Existing',
        nom: 'User',
        email: 'existing-api@example.com',
        password: 'hashedpassword',
        token: 'sometoken',
        is_verified: false
      }
    });

    const userData = {
      pseudo: 'existingapi',
      firstName: 'New',
      lastName: 'User',
      email: 'new-api@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Ce pseudo est déjà utilisé.');
    expect(res.body.success).toBeUndefined();
  });

  test('POST /register avec données invalides doit retourner des erreurs de validation JSON', async () => {
    const userData = {
      pseudo: 'ab', // Trop court
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email', // Email invalide
      password: '12' // Trop court
    };

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Erreurs de validation');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
    
    // Vérifier qu'on a bien les erreurs attendues
    const errorMessages = res.body.errors.map(err => err.msg);
    expect(errorMessages).toContain('Le pseudo doit avoir au moins 3 caractères');
    expect(errorMessages).toContain('Email invalide');
    expect(errorMessages).toContain('Le mot de passe doit avoir au moins 3 caractères');
  });

  test('POST /register avec pseudo contenant des caractères spéciaux doit échouer', async () => {
    const userData = {
      pseudo: 'test@user!', // Caractères non alphanumériques
      firstName: 'Test',
      lastName: 'User',
      email: 'test-special@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Erreurs de validation');
    expect(res.body.errors).toBeInstanceOf(Array);
    
    const errorMessages = res.body.errors.map(err => err.msg);
    expect(errorMessages).toContain('Le pseudo ne doit contenir que des caractères alphanumériques');
  });

  test('POST /register sans données requises doit retourner des erreurs de validation', async () => {
    const userData = {}; // Données manquantes

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Erreurs de validation');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /register doit créer un utilisateur non vérifié avec un token', async () => {
    const userData = {
      pseudo: 'tokentest',
      firstName: 'Token',
      lastName: 'Test',
      email: 'token-test@example.com',
      password: 'password123'
    };

    const res = await request(app)
      .post('/register')
      .send(userData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    // Vérifier que l'utilisateur est créé avec is_verified = false et un token
    const userInDb = await prisma.user.findUnique({
      where: { email: 'token-test@example.com' }
    });
    
    expect(userInDb.is_verified).toBe(false);
    expect(userInDb.token).toBeTruthy();
    expect(userInDb.token.length).toBeGreaterThan(10); // Token généré par crypto.randomBytes
    expect(userInDb.password).not.toBe('password123'); // Mot de passe hashé
  });
});