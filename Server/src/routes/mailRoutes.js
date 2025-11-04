import express from 'express';
import router from './authRoutes';

const route = express.Router();

router.post('/send/validate')