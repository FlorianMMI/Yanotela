// sessionConfig.js
import session from 'express-session';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super_secret_dev_key', 
  resave: false,
  saveUninitialized: false, 
  cookie: {
    secure: false, 
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600000, 
  }
});

export default sessionMiddleware;