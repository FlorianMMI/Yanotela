// import dotenv from 'dotenv';
// dotenv.config();

console.log('Variables d\'environnement chargées:', {
  FRONT_URL: process.env.FRONT_URL,
  REDIS_URL: process.env.REDIS_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  MAILTRAP_USER: process.env.MAILTRAP_USER,
  MAILTRAP_PASS: process.env.MAILTRAP_PASS,
});

import { Server } from 'socket.io';
import { createServer } from 'http';
import { app, prisma, sessionMiddleware } from './app.js';

const httpServer = createServer(app);
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';
const io = new Server(httpServer, {
  cors: {
    origin: FRONT_URL,
    credentials: true
  }
});
app.set('io', io);

// Pour que les sockets aient accès à req.session
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, () => {
    if (!socket.request.session || !socket.request.session.userId) {
      console.log('Session non trouvée ou utilisateur non connecté');
    } else {
      console.log('Session récupérée:', socket.request.session);
    }
    next();
  });
});

// Pour les tests, on peut utiliser un écho simple
io.on('connection', (socket) => {
  socket.on('message', (msg) => {
    socket.emit('message', msg); // réponse écho
  });
});

// Socket.IO
io.on('connection', async (socket) => {
  console.log('Un utilisateur connecté');

  // Récupérer les derniers messages (par exemple, les 50 plus récents)
  try {
    const lastMessages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },  // ou 'desc' puis inverser côté client
      take: 50,
    });
    // Envoyer l’historique au client connecté
    socket.emit('chat history', lastMessages);
  } catch (err) {
    console.error('Erreur récupération historique:', err);
  }

  socket.on('chat message', async (data) => {
    console.log('Message reçu:', data);
    try {
      const session = socket.request.session;
      console.log('Session:', session);
      if (!session.userId) {
        console.error('Utilisateur non connecté');
        return;
      }
      const pseudo = session.pseudo;
      const message = data.message;
      await prisma.message.create({
        data: {
          pseudo: pseudo,
          content: message,
        },
      });
      io.emit('chat message', {pseudo, message});
    } catch (err) {
      console.error('Erreur sauvegarde message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur déconnecté');
  });
});



// Démarrage
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur lancé sur ${FRONT_URL}`);
});

export { httpServer, io };