import request from 'supertest';
import app from '../src/app.js';

describe('Test des routes HTTP', () => {
  test('GET / doit renvoyer 200 et du HTML', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toMatch(/<!DOCTYPE html>/); // présence du HTML
  });
});
