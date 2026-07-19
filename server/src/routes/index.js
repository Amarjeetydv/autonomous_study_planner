const express = require('express');
const mongoose = require('mongoose');
const v1Routes = require('./v1');

const router = express.Router();

// Root health endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Autonomous Study Planner Backend is running successfully',
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// System health endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

router.use('/api/v1', v1Routes);

module.exports = router;

