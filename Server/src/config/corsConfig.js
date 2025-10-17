import cors from 'cors';

export const corsConfig = cors({
  origin: [
    process.env.CLIENT_URL || 'https://yanotela.fr',
    'https://yanotela.fr/api',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}); 
