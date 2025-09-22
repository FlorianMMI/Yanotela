import express from 'express';
import { register, login, logout, validate, validateRegistration, forgotPassword, resetPasswordGet, resetPasswordPost } from '../controllers/authController.js';

const router = express.Router();

router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register');
});

router.get('/forgot-password', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('forgotPassword');
});


router.post('/register', validateRegistration, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate/:token', validate);
router.post('/forgot-password', forgotPassword);
router.get('/resetPassword/:token', resetPasswordGet);
router.post('/reset-password', resetPasswordPost);

export default router;
