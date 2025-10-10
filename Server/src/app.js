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
  // Configuration pour supporter les gros messages (deltas Yjs)
  maxHttpBufferSize: 1e8 // 100 MB
});

// Configuration Redis pour le clustering (optionnel mais recommandé en production)
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('📡 Redis adapter configuré pour Socket.IO');
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
  
  console.log(`🔌 Socket connecté: ${socket.userPseudo} (${socket.userId})`);
  next();
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Utilisateur ${socket.userPseudo} connecté (socket: ${socket.id})`);

  /**
   * Événement: joinNote
   * L'utilisateur rejoint une room pour collaborer sur une note
   */
  socket.on('joinNote', async ({ noteId }) => {
    console.log(`🔔 ${socket.userPseudo} (${socket.userId}) tente de rejoindre la note ${noteId}`);
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
        console.log(`❌ Note ${noteId} introuvable`);
        socket.emit('error', { message: 'Note introuvable' });
        return;
      }

      // Vérifier les permissions (auteur ou permission existante)
      const isAuthor = note.authorId === socket.userId;
      const hasPermission = note.permissions.length > 0; // ✅ Accepter même si isAccepted=false
      const hasAccess = isAuthor || hasPermission;

      console.log(`🔍 Vérification accès: isAuthor=${isAuthor}, hasPermission=${hasPermission}, hasAccess=${hasAccess}`);

      if (!hasAccess) {
        console.log(`❌ Accès refusé pour ${socket.userPseudo}`);
        socket.emit('error', { message: 'Accès refusé à cette note' });
        return;
      }

      // Vérifier le mode lecture seule (role = 3)
      const isReadOnly = note.permissions.length > 0 && note.permissions[0].role === 3;

      // Rejoindre la room Socket.IO
      socket.join(`note-${noteId}`);

      // Obtenir ou créer le document Yjs
      const yDoc = getOrCreateYDoc(noteId, note.Content);

      // Ajouter l'utilisateur à la tracking list
      const userCount = addUserToNote(noteId, socket.id);

      // Envoyer l'état initial du document au client
      const stateVector = Y.encodeStateAsUpdate(yDoc);
      socket.emit('sync', {
        noteId,
        state: Buffer.from(stateVector).toString('base64'),
        userCount,
        isReadOnly
      });

      // Notifier les autres utilisateurs
      socket.to(`note-${noteId}`).emit('userJoined', {
        userId: socket.userId,
        pseudo: socket.userPseudo,
        userCount
      });

      console.log(`📝 ${socket.userPseudo} a rejoint la note ${noteId} (${userCount} utilisateurs)`);

    } catch (error) {
      console.error('Erreur lors de joinNote:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion à la note' });
    }
  });

  /**
   * Événement: yjsUpdate
   * Synchronisation des changements Yjs entre clients
   */
  socket.on('yjsUpdate', async ({ noteId, update }) => {
    console.log(`📥 yjsUpdate reçu de ${socket.userPseudo} (${socket.userId}) pour note ${noteId}`);
    try {
      // Récupérer le document Yjs
      const yDoc = getOrCreateYDoc(noteId);

      // Appliquer la mise à jour au document
      const updateBuffer = Buffer.from(update, 'base64');
      Y.applyUpdate(yDoc, updateBuffer);

      console.log(`📤 Diffusion de la mise à jour aux autres clients dans note-${noteId}`);
      
      // Diffuser la mise à jour aux autres clients dans la room
      socket.to(`note-${noteId}`).emit('yjsUpdate', {
        noteId,
        update,
        userId: socket.userId
      });

    } catch (error) {
      console.error('Erreur lors de yjsUpdate:', error);
    }
  });

  /**
   * Événement: cursorUpdate
   * Synchronisation des positions de curseur
   */
  socket.on('cursorUpdate', ({ noteId, cursor }) => {
    socket.to(`note-${noteId}`).emit('cursorUpdate', {
      userId: socket.userId,
      pseudo: socket.userPseudo,
      cursor
    });
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
  socket.on('disconnect', () => {
    console.log(`❌ Utilisateur ${socket.userPseudo} déconnecté`);
    
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
function handleUserLeave(socket, noteId) {
  const userCount = removeUserFromNote(noteId, socket.id);
  
  socket.to(`note-${noteId}`).emit('userLeft', {
    userId: socket.userId,
    pseudo: socket.userPseudo,
    userCount
  });
  
  socket.leave(`note-${noteId}`);
  console.log(`👋 ${socket.userPseudo} a quitté la note ${noteId}`);
}

export { app, sessionMiddleware, httpServer, io };