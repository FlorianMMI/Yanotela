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
  getOrCreateNoteSession,
  addUserToNote, 
  removeUserFromNote, 
  getActiveUserCount 
} from './services/collaborationService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fonction helper pour extraire le texte d'un état Lexical
 */
function extractTextFromLexical(lexicalState) {
  if (!lexicalState || !lexicalState.root || !lexicalState.root.children) {
    return '';
  }
  
  const extractFromNode = (node) => {
    if (node.type === 'text') {
      return node.text || '';
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractFromNode).join('');
    }
    return '';
  };
  
  return lexicalState.root.children.map(extractFromNode).join('\n');
}

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

      // ✅ SIMPLIFIÉ: Créer/obtenir la session de collaboration pour cette note
      const noteSession = getOrCreateNoteSession(noteId);
      
      // Rejoindre immédiatement - pas besoin d'attendre Yjs
      setImmediate(async () => {
        try {
          // ✅ Compter les VRAIS utilisateurs connectés dans la room Socket.IO  
          const socketsInRoom = await io.in(roomName).allSockets();
          const userCount = socketsInRoom.size;
          
          // Ajouter à la tracking list pour le cleanup
          addUserToNote(noteId, socket.id);
          
          console.log(`🔄 User ${socket.userPseudo} connecté à la note ${noteId} (${userCount} utilisateur(s))`);
          
          // ✅ Envoyer confirmation de connexion (sans données Yjs)
          socket.emit('noteJoined', {
            noteId,
            userCount,
            isReadOnly,
            content: note.Content || "" // Envoyer le contenu tel quel de la BDD
          });

          // Notifier les autres utilisateurs
          socket.to(`note-${noteId}`).emit('userJoined', {
            userId: socket.userId,
            pseudo: socket.userPseudo,
            userCount
          });
          
        } catch (syncError) {
          console.error('Erreur lors de la connexion:', syncError);
          socket.emit('error', { message: 'Erreur lors de la connexion à la note' });
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de joinNote:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion à la note' });
    }
  });

  /**
   * Événement: titleUpdate
   * Mise à jour du titre de la note
   */
  socket.on('titleUpdate', async ({ noteId, titre }) => {
    const roomName = `note-${noteId}`;
    
    if (!socket.rooms.has(roomName)) {
      console.warn(`⚠️ User ${socket.userPseudo} pas dans room ${roomName}`);
      return;
    }

    try {
      // 1️⃣ Sauvegarder en base de données
      await prisma.note.update({
        where: { id: noteId },
        data: { 
          Titre: titre,
          ModifiedAt: new Date(),
          modifierId: socket.userId
        }
      });
      console.log(`✅ [DB] Titre sauvegardé: "${titre}"`);

      // 2️⃣ Broadcaster aux autres clients de la room
      socket.to(roomName).emit('titleUpdate', {
        noteId,
        titre,
        userId: socket.userId,
        pseudo: socket.userPseudo
      });
      console.log(`� [Broadcast] Titre propagé dans room ${roomName}`);

    } catch (error) {
      console.error('❌ Erreur titleUpdate:', error);
      socket.emit('error', { message: 'Erreur lors de la mise à jour du titre' });
    }
  });

  /**
   * Événement: contentUpdate
   * Mise à jour du contenu de la note - Sauvegarde directe du JSON Lexical
   */
  socket.on('contentUpdate', async ({ noteId, content }) => {
    const roomName = `note-${noteId}`;
    
    if (!socket.rooms.has(roomName)) {
      console.warn(`⚠️ User ${socket.userPseudo} pas dans room ${roomName}`);
      return;
    }

    try {
      // ✅ OPTIMISATION: Broadcaster IMMÉDIATEMENT pour la réactivité temps réel
      socket.to(roomName).emit('contentUpdate', {
        noteId,
        content,
        userId: socket.userId,
        pseudo: socket.userPseudo
      });
      console.log(`📡 [Broadcast] Contenu propagé dans room ${roomName} (temps réel)`);

      // ✅ CORRECTION: Sauvegarder en BDD avec un petit délai pour éviter la surcharge
      // En cas de frappe rapide, seule la dernière version sera sauvegardée
      setTimeout(async () => {
        try {
          await prisma.note.update({
            where: { id: noteId },
            data: { 
              Content: content, // Garder le JSON Lexical original
              ModifiedAt: new Date(),
              modifierId: socket.userId
            }
          });
          console.log(`✅ [DB] Contenu JSON Lexical sauvegardé (${content.length} chars)`);
        } catch (dbError) {
          console.error('❌ Erreur sauvegarde BDD différée:', dbError);
        }
      }, 500); // 500ms de délai pour éviter les sauvegardes trop fréquentes

    } catch (error) {
      console.error('❌ Erreur contentUpdate:', error);
      socket.emit('error', { message: 'Erreur lors de la mise à jour du contenu' });
    }
  });

  /**
   * Événement: cursorUpdate
   * Position du curseur d'un utilisateur
   */
  socket.on('cursorUpdate', ({ noteId, cursor }) => {
    const roomName = `note-${noteId}`;
    
    if (!socket.rooms.has(roomName)) return;

    // Broadcaster la position du curseur aux autres
    socket.to(roomName).emit('cursorUpdate', {
      noteId,
      cursor,
      userId: socket.userId,
      pseudo: socket.userPseudo
    });
  });

  /**
   * Événement: selectionUpdate
   * Sélection de texte d'un utilisateur
   */
  socket.on('selectionUpdate', ({ noteId, selection }) => {
    const roomName = `note-${noteId}`;
    
    if (!socket.rooms.has(roomName)) return;

    // Broadcaster la sélection aux autres
    socket.to(roomName).emit('selectionUpdate', {
      noteId,
      selection,
      userId: socket.userId,
      pseudo: socket.userPseudo
    });
  });

  /**
   * Événement: userTyping
   * Indique qu'un utilisateur est en train de taper
   */
  socket.on('userTyping', ({ noteId, isTyping }) => {
    const roomName = `note-${noteId}`;
    
    if (!socket.rooms.has(roomName)) return;

    // Broadcaster l'état de frappe aux autres
    socket.to(roomName).emit('userTyping', {
      noteId,
      isTyping,
      userId: socket.userId,
      pseudo: socket.userPseudo
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
