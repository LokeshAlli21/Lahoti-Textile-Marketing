// hotelRoutes.js
import express from 'express';
import {
  getDashboardView,
} from '../controllers/hotelController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.get('/get-view', protect, getDashboardView)

export default router;
