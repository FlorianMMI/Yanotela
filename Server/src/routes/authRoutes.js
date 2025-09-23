import express from 'express';
import { register, login, logout, validate, validateRegistration, forgotPassword, resetPasswordGet, resetPasswordPost } from '../controllers/authController.js';

const router = express.Router();

// Routes d'authentification
router.post('/register', validateRegistration, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate/:token', validate);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', resetPasswordGet);
router.post('/reset-password', resetPasswordPost);

export default router;
