import express from 'express';
import { register, login, logout, validate, validateRegistration, forgotPassword, resetPasswordGet, resetPasswordPost, checkAuth } from '../controllers/authController.js';
// import { requireTurnstile } from '../middlewares/turnstile.js';

const router = express.Router();

// Routes d'authentification
// router.post('/register', requireTurnstile(), validateRegistration, register);
router.post('/register', validateRegistration, register);
// router.post('/login', requireTurnstile(), login);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate/:token', validate);
// router.post('/forgot-password', requireTurnstile(), forgotPassword);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', resetPasswordGet);
// router.post('/reset-password', requireTurnstile(), resetPasswordPost);
router.post('/reset-password', resetPasswordPost);
router.get('/auth/check', checkAuth);

export default router;
