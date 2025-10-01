/**
 * @fileoverview
 * Fichier de test pour l'endpoint GET /note/get.
 * Utilise Supertest et Jest pour vérifier que la récupération de toutes les notes fonctionne correctement.
 * Ce fichier permet de s'assurer que l'API retourne bien un tableau de notes lors d'une requête GET sur /note/get.
 */

import request from 'supertest';
import { jest } from '@jest/globals';
import {app} from '../../src/app.js';





test('GET /note/get devrait récupérer toutes les notes', async () => {
    const response = await request(app)
        .get('/note/get')
        .expect(200);
        
    expect(Array.isArray(response.body)).toBe(true);
    // Vous pouvez ajouter plus de validations en fonction de la structure de vos notes
});


test('GET /note/get/:id devrait récupérer une note par ID', async () => {
    const response = await request(app)
        .get('/note/get/1') // Remplacez '1' par un ID de note valide dans votre base de données de test
        .expect(200);

    expect(response.body).toHaveProperty('titre');
    expect(response.body).toHaveProperty('content');
});
