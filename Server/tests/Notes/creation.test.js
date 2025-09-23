import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../../src/app.js';

// Mock Prisma
const mockPrismaClient = {
  note: {
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock du module Prisma
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

describe('POST /note/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mockPrismaClient.$disconnect();
  });

test('devrait créer une note avec succès', async () => {
    const noteData = {
        Titre: 'Test Note',
        Content: 'Contenu de test',
        authorId: 1
    };

    const response = await request(app)
        .post('/note/create')
        .send(noteData)
        .expect(201);

    expect(response.body).toHaveProperty('message', 'Note créée avec succès');
    expect(response.body).toHaveProperty('note');
    expect(response.body.note).toMatchObject(noteData);
    expect(response.body.note).toHaveProperty('id');
    expect(response.body.note).toHaveProperty('ModifiedAt');
});

  test('devrait retourner une erreur 400 si aucune donnée n\'est envoyée', async () => {
    const response = await request(app)
      .post('/note/create')
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      message: 'Aucune donnée reçue dans req.body'
    });


  });

  test('devrait valider que tous les champs requis sont présents', async () => {
    const incompleteData = {
      Titre: 'Test Note'
      // Manque Content et authorId
    };

    const response = await request(app)
      .post('/note/create')
      .send(incompleteData)
      .expect(500); // Le controller devrait gérer cette validation

  });
});


