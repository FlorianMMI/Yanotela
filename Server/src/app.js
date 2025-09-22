


import express from 'express';
import helmet from 'helmet';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sessionMiddleware  from './config/sessionConfig.js';
import { corsConfig } from './config/corsConfig.js';
import noteRoutes from './routes/noteRoutes.js';





const app = express();

// Équivalent de __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Sécurité de base
app.use(sessionMiddleware);
app.use(corsConfig);
app.use(express.static(join(__dirname, '../public')));

app.use('/note', noteRoutes);


export default app;