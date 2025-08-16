// adminRoutes.js
import express from 'express';
import {
  createUser,
  updateUser,
  getAllUsers,
  getUserById,
  softDeleteUser,
  recoverUser, 
} from '../controllers/adminController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

// Get all users (includes deleted users)
router.get('/users', protect, getAllUsers);

// Get user by ID
router.get('/users/:id', protect, getUserById);

// Create a new user
router.post('/users', protect, createUser);

// Update user details
router.put('/users/:id', protect, updateUser);

// Soft delete user
router.delete('/users/:id', protect, softDeleteUser);

// ✅ Recover soft-deleted user
router.patch('/users/:id/recover', protect, recoverUser);

export default router;