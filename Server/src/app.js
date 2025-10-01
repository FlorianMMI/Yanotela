import 'dotenv/config'; 

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sessionMiddleware from './config/sessionConfig.js';
import {corsConfig} from './config/corsConfig.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import helmet from 'helmet';
import googleAuthRoutes from './routes/googleAuthRoutes.js';


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

<<<<<<< HEAD
app.use('/auth', googleAuthRoutes);

app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.render('index');
  } else {
    return res.render('index', {
      pseudo: req.session.pseudo,
      connected: true
    });
  }
});

// Route pour tester l'authentification Google
app.get('/google-test', (req, res) => {
  res.render('google-auth', {
    user: req.session.userId ? {
      id: req.session.userId,
      pseudo: req.session.pseudo,
      isLoggedIn: true
=======
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
>>>>>>> Develop
    } : null
  });
});

<<<<<<< HEAD
export { app, prisma, sessionMiddleware };
export default app;
=======
export { app, sessionMiddleware };
>>>>>>> Develop
