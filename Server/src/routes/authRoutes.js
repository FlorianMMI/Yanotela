import express from 'express';
import { register, login, logout, validate, validateRegistration } from '../controllers/authController.js';

const router = express.Router();

router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register');
});

router.post('/register', validateRegistration, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate/:token', validate);

export default router;
