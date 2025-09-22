import cors from 'cors';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const corsConfig = cors({
  origin: FRONT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

export default corsConfig;
