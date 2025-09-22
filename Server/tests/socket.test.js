// __tests__/socket.test.js
import { io as Client } from 'socket.io-client';
import { httpServer } from '../src/server.js'; // adapte le chemin si nécessaire

let clientSocket;

// beforeAll((done) => {
//     httpServer.listen(3000, () => done());
// });

afterAll((done) => {
    if (clientSocket?.connected) clientSocket.disconnect();
    httpServer.close(() => done());
});

describe('Test des sockets', () => {
    test('Le serveur renvoie le message envoyé', (done) => {
        clientSocket = new Client('http://localhost:3000');

        clientSocket.on('connect', () => {
            clientSocket.emit('message', 'Bonjour serveur');

            clientSocket.on('message', (data) => {
                expect(data).toBe('Bonjour serveur');
                done();
            });
        });
    });
});
