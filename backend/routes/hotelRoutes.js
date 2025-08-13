// hotelRoutes.js
import express from 'express';
import {
  addHotel,
  updateHotel,
  getHotels,
  getHotelById,
  softDeleteHotel
} from '../controllers/hotelController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

// Add a new hotel
router.post('/', protect, addHotel);

// Update hotel details
router.put('/:id', protect, updateHotel);

// Get all hotels (supports search & pagination)
router.get('/', protect, getHotels);

// Get hotel by ID
router.get('/:id', protect, getHotelById);

// Soft delete hotel
router.delete('/:id', protect, softDeleteHotel);

export default router;
