const express = require('express');
const { prisma } = require('../config/db');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Check system and database health
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      service: 'core-cms-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: 'connected',
        type: 'PostgreSQL',
        latencyMs: dbLatencyMs
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'core-cms-api',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

module.exports = router;
