import 'dotenv/config'; 

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import * as Y from 'yjs';
import sessionMiddleware from './config/sessionConfig.js';
import {corsConfig} from './config/corsConfig.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import FolderRoutes from './routes/FolderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import helmet from 'helmet';
import { 
  getOrCreateYDoc, 
  addUserToNote, 
  removeUserFromNote, 
  getActiveUserCount 
} from './services/collaborationService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.set('trust proxy', 1);
app.use(helmet()); // Sécurité de base
app.use(sessionMiddleware);
app.use(corsConfig);
app.use(express.static(join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/note', noteRoutes);
app.use('/user', userRoutes);
app.use('/permission', permissionRoutes);
app.use('/auth', googleAuthRoutes); // Routes Google OAuth
app.use('/notification', notificationRoutes);
app.use('/folder', FolderRoutes); // Routes pour les dossiers

// Route de health check pour Docker
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de base - API uniquement
app.get('/', (req, res) => {
  res.json({
    message: 'Yanotela API',
    version: '1.0.0',
    status: 'running',
    authenticated: !!req.session.userId,
    user: req.session.userId ? {
      id: req.session.userId,
      pseudo: req.session.pseudo
    } : null
  });
});

// ========================================
// Configuration Socket.IO pour collaboration temps réel
// ========================================

const httpServer = createServer(app);

// Configuration de Socket.IO avec CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10 MB
});

// Configuration Redis pour le clustering (optionnel mais recommandé en production)
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter configuré');
  }).catch((err) => {
    console.warn('⚠️  Redis non disponible, mode standalone:', err.message);
  });
}

// Middleware d'authentification Socket.IO avec express-session
io.engine.use(sessionMiddleware);

io.use((socket, next) => {
  const session = socket.request.session;
  
  // Vérifier que l'utilisateur est authentifié
  if (!session || !session.userId) {
    return next(new Error('Authentification requise'));
  }
  
  // Attacher les infos utilisateur au socket
  socket.userId = session.userId;
  socket.userPseudo = session.pseudo;
  
  next();
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Socket connecté: ${socket.id} (user: ${socket.userPseudo})`);

  /**
   * Événement: joinNote
   * L'utilisateur rejoint une room pour collaborer sur une note
   */
  socket.on('joinNote', async ({ noteId }) => {
    const roomName = `note-${noteId}`;
    
    // Vérifier si déjà dans la room
    if (socket.rooms.has(roomName)) {
      console.log(`⚠️  User ${socket.userPseudo} déjà dans room ${roomName}`);
      return;
    }
    
    try {
      // Vérifier que l'utilisateur a accès à cette note
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: {
          permissions: {
            where: { userId: socket.userId }
          }
        }
      });

      if (!note) {
        socket.emit('error', { message: 'Note introuvable' });
        return;
      }

      // Vérifier les permissions (auteur ou permission existante)
      const isAuthor = note.authorId === socket.userId;
      const hasPermission = note.permissions.length > 0;
      const hasAccess = isAuthor || hasPermission;

      if (!hasAccess) {
        socket.emit('error', { message: 'Accès refusé à cette note' });
        return;
      }

      // Vérifier le mode lecture seule (role = 3)
      const isReadOnly = note.permissions.length > 0 && note.permissions[0].role === 3;

      // Rejoindre la room Socket.IO (la room est créée automatiquement si elle n'existe pas)
      socket.join(roomName);
      console.log(`✅ User ${socket.userPseudo} a rejoint room ${roomName}`);

      // ✅ CORRECTION CRITIQUE: Obtenir/créer le document Yjs et attendre l'initialisation
      const yDoc = getOrCreateYDoc(noteId, note.Content);
      
      // ✅ ATTENDRE que le document soit complètement initialisé
      // On utilise setImmediate pour s'assurer que toutes les opérations synchrones Yjs sont terminées
      setImmediate(async () => {
        try {
          // ✅ Compter les VRAIS utilisateurs connectés dans la room Socket.IO  
          const socketsInRoom = await io.in(roomName).allSockets();
          const userCount = socketsInRoom.size;
          
          // Ajouter à la tracking list pour le cleanup (optionnel)
          addUserToNote(noteId, socket.id);

          // ✅ MAINTENANT envoyer l'état complet du document au client
          const stateVector = Y.encodeStateAsUpdate(yDoc);
          const finalContent = yDoc.getText('content').toString();
          
          console.log(`🔄 Sync envoyé pour note ${noteId}: ${finalContent.length} caractères, ${userCount} utilisateur(s)`);
          
          socket.emit('sync', {
            noteId,
            state: Buffer.from(stateVector).toString('base64'),
            userCount,
            isReadOnly
          });

          // Notifier les autres utilisateurs avec le nombre réel
          socket.to(`note-${noteId}`).emit('userJoined', {
            userId: socket.userId,
            pseudo: socket.userPseudo,
            userCount
          });
          
        } catch (syncError) {
          console.error('Erreur lors de la synchronisation:', syncError);
          socket.emit('error', { message: 'Erreur lors de la synchronisation' });
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de joinNote:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion à la note' });
    }
  });

  socket.on('titleUpdate', async ({ noteId, titre }) => {
    const roomName = `note-${noteId}`;
    
    // Vérifier que l'utilisateur est dans la room
    if (!socket.rooms.has(roomName)) {
      console.warn(`⚠️ Socket ${socket.id} essaie d'update note ${noteId} sans être dans la room`);
      return;
    }

    try {
      // Mettre à jour le titre dans la base de données
      await prisma.note.update({
        where: { id: noteId },
        data: { 
          Titre: titre,
          ModifiedAt: new Date()
        }
      });

      // Diffuser le changement de titre à tous les autres utilisateurs dans la room
      socket.to(roomName).emit('titleUpdate', {
        noteId,
        titre,
        userId: socket.userId,
        pseudo: socket.userPseudo
      });

      console.log(`📝 Titre mis à jour par ${socket.userPseudo}: "${titre}"`);
    } catch (error) {
      console.error('❌ Erreur lors de titleUpdate:', error);
      socket.emit('error', { message: 'Erreur lors de la mise à jour du titre' });
    }
  });

  /**
   * Événement: contentUpdate
   * Un utilisateur change le contenu de la note
   */
  socket.on('contentUpdate', async ({ noteId, content }) => {
    const roomName = `note-${noteId}`;
    
    // Vérifier que l'utilisateur est dans la room
    if (!socket.rooms.has(roomName)) {
      return;
    }

    try {
      // Mettre à jour le contenu en base de données
      await prisma.note.update({
        where: { id: noteId },
        data: { Content: content, ModifiedAt: new Date() }
      });

      // Diffuser le changement de contenu à tous les autres utilisateurs dans la room
      socket.to(roomName).emit('contentUpdate', {
        noteId,
        content,
        userId: socket.userId,
        pseudo: socket.userPseudo
      });

      console.log(`📝 Contenu mis à jour par ${socket.userPseudo} (${content.length} chars)`);
    } catch (error) {
      console.error('❌ Erreur lors de contentUpdate:', error);
    }
  });

  /**
   * Événement: leaveNote
   * L'utilisateur quitte une note
   */
  socket.on('leaveNote', ({ noteId }) => {
    handleUserLeave(socket, noteId);
  });

  /**
   * Déconnexion du socket
   */
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket déconnecté: ${socket.id} (raison: ${reason})`);
    
    // Notifier toutes les rooms où l'utilisateur était présent
    const rooms = Array.from(socket.rooms).filter(room => room.startsWith('note-'));
    
    rooms.forEach(room => {
      const noteId = room.replace('note-', '');
      handleUserLeave(socket, noteId);
    });
  });
});

/**
 * Gérer le départ d'un utilisateur d'une note
 */
async function handleUserLeave(socket, noteId) {
  const roomName = `note-${noteId}`;
  
  // Quitter la room Socket.IO
  socket.leave(roomName);
  console.log(`👋 User ${socket.userPseudo} a quitté room ${roomName}`);
  
  // Compter les utilisateurs restants dans la room
  const socketsInRoom = await io.in(roomName).allSockets();
  const userCount = socketsInRoom.size;
  
  // Notifier les autres utilisateurs
  socket.to(roomName).emit('userLeft', {
    userId: socket.userId,
    pseudo: socket.userPseudo,
    userCount
  });
}

export { app, sessionMiddleware, httpServer, io };