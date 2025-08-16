// hotelRoutes.js
import express from 'express';
import {
  getDashboardViewForAdmin,
  getDashboardViewForUser,
} from '../controllers/hotelController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.get('/get-view', protect, getDashboardViewForAdmin)
router.get('/get-view-for-user/:id', protect, getDashboardViewForUser)

export default router;
