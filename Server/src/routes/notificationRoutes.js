import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';



const router = Router();

router.get('/info', NotificationController.getInfo);