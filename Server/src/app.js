import 'dotenv/config'; 

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
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

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.set('trust proxy', 1);
app.use(helmet()); // Sécurité de base
app.use(sessionMiddleware);
app.use(corsConfig);
app.use(express.static(join(__dirname, '../public')));
// 🔥 Augmentation de la limite pour supporter les images base64 dans yjsState
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.disable('x-powered-by');

// Routes
app.use('/', authRoutes);
app.use('/note', noteRoutes);
app.use('/user', userRoutes);
app.use('/permission', permissionRoutes);
app.use('/auth', googleAuthRoutes); // Routes Google OAuth
app.use('/notification', notificationRoutes);
app.use('/dossiers', FolderRoutes); // Routes pour les dossiers

// Route de health check pour Docker
app.get('/health', (req, res) => {
  res.status(200).send({
  });
});

// Route de base - API uniquement
app.get('/', (req, res) => {
res.status(200).send({
  });
});

// Création du serveur HTTP
const httpServer = createServer(app);

// Export pour utilisation dans index.js
export { app, sessionMiddleware, httpServer };
