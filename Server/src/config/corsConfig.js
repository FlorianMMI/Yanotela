import cors from 'cors';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const corsConfig = cors({
  origin: FRONT_URL,
  credentials: true,
});

export default corsConfig;
