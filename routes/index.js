import express from 'express';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import userRoutes from './userRoutes.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Public routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication required)
router.use('/invoices', authenticateToken, invoiceRoutes);
router.use('/clients', authenticateToken, clientRoutes);
router.use('/users', userRoutes); // Admin-only routes with auth middleware inside

export default router; 