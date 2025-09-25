/**
 * @fileoverview
 * Fichier de test pour l'endpoint GET /note/get.
 * Utilise Supertest et Jest pour vérifier que la récupération de toutes les notes fonctionne correctement.
 * Ce fichier permet de s'assurer que l'API retourne bien un tableau de notes lors d'une requête GET sur /note/get.
 */

import request from 'supertest';
import {app} from '../../src/app.js';

test('UPDATE /note/update/:id devrait mettre à jour une note par son ID', async ()=> {

    const updatedData = { Titre: 'Titre mis à jour', Content: 'Contenu mis à jour' };
    
    const response = await request(app)
        .post('/note/update/1') // Remplacez '1' par un ID de note valide dans votre base de données de test
        .send(updatedData)
        .expect(200);

    expect(response.body).toHaveProperty('Titre', updatedData.Titre);
    expect(response.body).toHaveProperty('Content', updatedData.Content);

    await request(app)
        .post('/note/update/1')
        .send({ Titre: 'Test supprimé', Content: 'Test supprimé' })
        .expect(200);
})