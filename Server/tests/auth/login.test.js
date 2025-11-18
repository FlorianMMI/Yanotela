import request from 'supertest';
import {app} from '../../src/app.js';
import { getPrismaTestInstance, generateUniqueToken, cleanupTestData } from '../testUtils.js';
import bcrypt from 'bcrypt';

const prisma = getPrismaTestInstance();

describe('Tests API Login (/login)', () => {
  let testUser;
  let unverifiedUser;
  
  const testEmails = ['test-login-api@example.com', 'unverified-api@example.com'];
  const testPseudos = ['loginapi', 'unverifiedapi'];

  beforeEach(async () => {
    // Nettoyer les données de test
    await cleanupTestData(prisma, testEmails, testPseudos);

    // Créer un utilisateur de test vérifié
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        pseudo: 'loginapi',
        email: 'test-login-api@example.com',
        password: hashedPassword,
        prenom: 'Test',
        nom: 'User',
        is_verified: true,
        token: generateUniqueToken('login_verified')
      }
    });

    // Créer un utilisateur non vérifié
    unverifiedUser = await prisma.user.create({
      data: {
        pseudo: 'unverifiedapi',
        email: 'unverified-api@example.com',
        password: hashedPassword,
        prenom: 'Unverified',
        nom: 'User',
        is_verified: false,
        token: generateUniqueToken('login_unverified')
      }
    });
  });

  afterEach(async () => {
    await cleanupTestData(prisma, testEmails, testPseudos);
  });

  test('POST /login avec pseudo et mot de passe valides doit retourner JSON de succès', async () => {
    const loginData = {
      identifiant: 'loginapi',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({
      id: testUser.id,
      pseudo: 'loginapi',
      email: 'test-login-api@example.com'
    });
    expect(res.body.user.password).toBeUndefined(); // Le mot de passe ne doit pas être retourné
  });

  test('POST /login avec email et mot de passe valides doit retourner JSON de succès', async () => {
    const loginData = {
      identifiant: 'test-login-api@example.com',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({
      id: testUser.id,
      pseudo: 'loginapi',
      email: 'test-login-api@example.com'
    });
  });

  test('POST /login avec identifiant inexistant doit retourner erreur JSON', async () => {
    const loginData = {
      identifiant: 'inexistant',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Utilisateur ou mot de passe incorrect');
    expect(res.body.success).toBe(false);
  });

  test('POST /login avec mot de passe incorrect doit retourner erreur JSON', async () => {
    const loginData = {
      identifiant: 'loginapi',
      password: 'mauvaispassword'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Utilisateur ou mot de passe incorrect');
    expect(res.body.success).toBe(false);
  });

  test('POST /login avec compte non vérifié doit retourner erreur JSON', async () => {
    const loginData = {
      identifiant: 'unverifiedapi',
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('Compte non activé');
    expect(res.body.success).toBe(false);
  });

  test('POST /login sans identifiant doit retourner erreur JSON', async () => {
    const loginData = {
      password: 'testpassword123'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Identifiant et mot de passe requis');
    expect(res.body.success).toBe(false);
  });

  test('POST /login sans mot de passe doit retourner erreur JSON', async () => {
    const loginData = {
      identifiant: 'loginapi'
    };

    const res = await request(app)
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Identifiant et mot de passe requis');
    expect(res.body.success).toBe(false);
  });

  test('POST /login sans données doit retourner erreur JSON', async () => {
    const res = await request(app)
      .post('/login')
      .send({})
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Identifiant et mot de passe requis');
    expect(res.body.success).toBe(false);
  });

  test('POST /login avec succès doit créer une session', async () => {
    const loginData = {
      identifiant: 'loginapi',
      password: 'testpassword123'
    };

    const agent = request.agent(app); // Utiliser un agent pour maintenir les cookies de session

    const res = await agent
      .post('/login')
      .send(loginData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Vérifier que la session est créée en testant une route protégée
    // (Si vous avez des routes protégées qui vérifient la session)
    // Pour l'instant, on vérifie juste que les cookies de session sont présents
    expect(res.headers['set-cookie']).toBeDefined();
    
    // Chercher le cookie de session
    const sessionCookie = res.headers['set-cookie'].find(cookie => 
      cookie.includes('connect.sid')
    );
    expect(sessionCookie).toBeDefined();
  });
});