import 'dotenv/config'; // <-- AJOUTEZ CETTE LIGNE ICI !

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sessionMiddleware from './config/sessionConfig.js';
import corsConfig from './config/corsConfig.js';
import authRoutes from './routes/authRoutes.js';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';

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

// Config Twig
app.set('views', join(__dirname, '../views'));
app.set('view engine', 'twig');

// Routes
app.use('/', authRoutes);

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

export { app, prisma, sessionMiddleware };
export default app;