import { chromium } from 'playwright';
import { httpServer } from '../src/server.js';

let browser, page;

beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
}, 10000); // Augmente le délai d'attente pour beforeAll

afterAll(async () => {
    await browser.close();
    await new Promise((resolve) => httpServer.close(resolve));
}, 10000); // Augmente le délai d'attente pour afterAll

describe('Session utilisateur', () => {
    test('Connexion et envoi d’un message', async () => {
        // Connexion via formulaire
        await page.waitForSelector('form#login-form');
        await page.fill('input[name="pseudo"]', 'aaa');
        await page.fill('input[name="password"]', 'aaa');
        await page.click('form#login-form button[type="submit"]');

        // // Attendre que la connexion soit établie et que le chat soit visible
        await page.goto('http://localhost:3000');
        await page.waitForSelector('#chat-container');

        // // Attendre que le script de gestion du chat soit chargé
        // await page.waitForFunction(() => {
        //     // Vérifiez que le socket est bien connecté
        //     return typeof window.socket !== 'undefined' && window.socket.connected;
        // });

        // // Envoi d’un message
        await page.fill('#message', 'Bonjour !');
        await page.click('#message-form button');

        // // Attendre que le message soit affiché
        // await page.waitForSelector('#messages li:has-text("Bonjour")', { timeout: 10000 }); // Augmente le délai d'attente pour cette attente spécifique

        // Vérifie que le message est bien affiché
        const messages = await page.$$eval('#messages li', els =>
            els.map(el => el.textContent)
        );
        expect(messages.some(m => m.includes('Bonjour'))).toBe(true);
    }, 20000); // Augmente le délai d'attente pour le test
});
