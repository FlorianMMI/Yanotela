import request from 'supertest';
import { app } from '../../src/app.js';

describe('Tests d\'authentification Google', () => {
  
  test('GET /auth/google doit rediriger vers Google', async () => {
    const res = await request(app).get('/auth/google');
    
    // Doit rediriger (302) vers une URL Google
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
    expect(res.headers.location).toContain('oauth2');
  });
  
  test('GET /auth/google/callback sans paramètres doit échouer', async () => {
    const res = await request(app).get('/auth/google/callback');
    
    // Peut soit retourner 400 (erreur affichée) soit rediriger (302)
    expect([400,302]).toContain(res.statusCode);
    if (res.statusCode === 400) expect(res.text).toContain('Connexion Google');
  });
  
  test('GET /auth/google/callback avec erreur doit gérer l\'erreur', async () => {
    const res = await request(app)
      .get('/auth/google/callback')
      .query({
        error: 'access_denied',
        error_description: 'User denied access'
      });
    
    expect([400,302]).toContain(res.statusCode);
    if (res.statusCode === 400) expect(res.text).toContain('Connexion Google annulée');
  });
  
  test('POST /auth/google/logout sans session doit réussir', async () => {
    const res = await request(app).post('/auth/google/logout');
    
    // Doit rediriger vers l'accueil même sans session
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });
  
  test('GET /auth/google/link sans session doit échouer', async () => {
    const res = await request(app).get('/auth/google/link');
    
    expect([401,302]).toContain(res.statusCode);
    if (res.statusCode === 401) expect(res.text).toContain('connecté');
  });
  
  test('Configuration Google doit être validée', async () => {
    // Test que la configuration peut être importée sans erreur
    const { validateGoogleConfig } = await import('../../src/config/googleConfig.js');
    
    // Si les variables d'environnement ne sont pas définies, doit lever une erreur
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      expect(() => validateGoogleConfig()).toThrow();
    } else {
      expect(() => validateGoogleConfig()).not.toThrow();
    }
  });
  
  test('Service Google Auth doit être instanciable', async () => {
    const googleAuthService = await import('../../src/services/googleAuthService.js');
    
    expect(googleAuthService.default).toBeDefined();
    expect(typeof googleAuthService.default.generatePseudo).toBe('function');
    expect(typeof googleAuthService.default.formatUserData).toBe('function');
  });
  
  test('Génération de pseudo doit fonctionner', async () => {
    const googleAuthService = await import('../../src/services/googleAuthService.js');
    
    const userInfo = {
      given_name: 'Jean',
      family_name: 'Dupont',
      email: 'jean.dupont@gmail.com'
    };
    
    const pseudo = googleAuthService.default.generatePseudo(userInfo);
    
    expect(pseudo).toBeDefined();
    expect(pseudo.length).toBeGreaterThanOrEqual(3);
    expect(pseudo).toMatch(/^[a-zA-Z0-9]+$/); // Alphanumérique seulement
  });
  
  test('Formatage des données utilisateur doit fonctionner', async () => {
    const googleAuthService = await import('../../src/services/googleAuthService.js');
    
    const userInfo = {
      given_name: 'Jean',
      family_name: 'Dupont',
      email: 'jean.dupont@gmail.com'
    };
    
    const userData = googleAuthService.default.formatUserData(userInfo, 'jean123');
    
    expect(userData).toEqual({
      pseudo: 'jean123',
      email: 'jean.dupont@gmail.com',
      prenom: 'Jean',
      nom: 'Dupont',
      is_verified: true
    });
  });
  
});