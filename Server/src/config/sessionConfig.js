import session from 'express-session';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'yanotela-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true en production avec HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
});