/**
 * @fileoverview
 * Tests d'intégration pour la récupération de notes
 */

import request from 'supertest';
import { app } from '../../src/app.js';
import { getPrismaTestInstance, createTestUser, cleanupUser } from '../testUtils.js';
import { randomUUID } from 'crypto';

const prisma = getPrismaTestInstance();

describe('GET /note/get', () => {
  let testUser;
  let authAgent;
  let testNote;

  beforeAll(async () => {
    const result = await createTestUser(prisma, 'noteget');
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

    // Créer une note de test
    testNote = await prisma.note.create({
      data: {
        id: randomUUID(),
        Titre: 'Note de test',
        Content: JSON.stringify({ root: { children: [] } }),
        authorId: testUser.id
      }
    });

    await prisma.permission.create({
      data: {
        noteId: testNote.id,
        userId: testUser.id,
        role: 0
      }
    });
  });

  afterAll(async () => {
    await cleanupUser(prisma, testUser.id);
    await prisma.$disconnect();
  });

  test('GET /note/get devrait récupérer toutes les notes', async () => {
    const response = await authAgent
      .get('/note/get')
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body) || Array.isArray(response.body.notes)).toBe(true);
  });

  test('GET /note/get/:id devrait récupérer une note par ID', async () => {
    const response = await authAgent
      .get(`/note/get/${testNote.id}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.note || response.body).toHaveProperty('Titre');
  });

  test('GET /note/get/:id avec ID inexistant devrait retourner 404', async () => {
    const fakeId = randomUUID();
    const response = await authAgent
      .get(`/note/get/${fakeId}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(404);
  });
});
