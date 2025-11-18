/**
 * @fileoverview
 * Tests d'intégration pour la mise à jour de notes
 */

import request from 'supertest';
import { app } from '../../src/app.js';
import { getPrismaTestInstance, createTestUser, cleanupUser } from '../testUtils.js';
import { randomUUID } from 'crypto';

const prisma = getPrismaTestInstance();

describe('POST /note/update/:id', () => {
  let testUser;
  let authAgent;
  let testNote;

  beforeAll(async () => {
    const result = await createTestUser(prisma, 'noteupdate');
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
        Titre: 'Note originale',
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

  test('UPDATE /note/update/:id devrait mettre à jour une note par son ID', async () => {
    const updatedData = {
      Titre: 'Titre mis à jour',
      Content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Contenu mis à jour' }] }] } })
    };

    const response = await authAgent
      .post(`/note/update/${testNote.id}`)
      .send(updatedData)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.note.Titre).toBe(updatedData.Titre);
  });

  test('UPDATE /note/update/:id avec ID inexistant devrait retourner 404', async () => {
    const fakeId = randomUUID();
    const updatedData = { Titre: 'Test' };

    const response = await authAgent
      .post(`/note/update/${fakeId}`)
      .send(updatedData)
      .set('Accept', 'application/json');

    expect([403,404]).toContain(response.statusCode);
  });

  test('UPDATE /note/update/:id devrait permettre de modifier uniquement le titre', async () => {
    const updatedData = { Titre: 'Nouveau titre seulement' };

    const response = await authAgent
      .post(`/note/update/${testNote.id}`)
      .send(updatedData)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body.note.Titre).toBe('Nouveau titre seulement');
  });
});