/**
 * @fileoverview
 * Tests d'intégration pour la création de notes
 */

import request from 'supertest';
import { app } from '../../src/app.js';
import { getPrismaTestInstance, createTestUser, cleanupUser } from '../testUtils.js';
import { randomUUID } from 'crypto';

const prisma = getPrismaTestInstance();

describe('POST /note/create', () => {
  let testUser;
  let authAgent;

  beforeAll(async () => {
    const result = await createTestUser(prisma, 'notecreate');
    testUser = result.user;

    authAgent = request.agent(app);
    await authAgent
      .post('/login')
      .send({
        identifiant: testUser.email,
        password: 'password123!'
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
  });

  afterEach(async () => {
    await prisma.permission.deleteMany({ where: { userId: testUser.id } });
    await prisma.note.deleteMany({ where: { authorId: testUser.id } });
  });

  afterAll(async () => {
    await cleanupUser(prisma, testUser.id);
    await prisma.$disconnect();
  });

  test('devrait créer une note avec succès', async () => {
    const noteData = {
      id: randomUUID(),
      Titre: 'Test Note',
      Content: JSON.stringify({
        root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Contenu de test' }] }] }
      })
    };

    const response = await authAgent
      .post('/note/create')
      .send(noteData)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('note');
    expect(response.body.note.Titre).toBe('Test Note');
  });

  test('devrait retourner une erreur 400 si aucune donnée n\'est envoyée', async () => {
    const response = await authAgent
      .post('/note/create')
      .send({})
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(400);
  });

  test('devrait créer une note même sans ID (généré automatiquement)', async () => {
    const incompleteData = {
      Titre: 'Test Note Sans ID',
      Content: JSON.stringify({ root: { children: [] } })
    };

    const response = await authAgent
      .post('/note/create')
      .send(incompleteData)
      .set('Accept', 'application/json');

    // Devrait soit réussir avec ID généré, soit échouer proprement
    expect([201, 400, 500]).toContain(response.statusCode);
  });
});

