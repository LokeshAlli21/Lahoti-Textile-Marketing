import express from 'express';
import { login, getUser } from '../controllers/authController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.post('/login', login);
router.get('/user', protect, getUser);

export default router;