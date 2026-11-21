const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

// Mount Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Base API index info
router.get('/', (req, res) => {
  res.json({
    name: 'Core CMS API',
    version: '1.0.0',
    description: 'Custom Headless CMS API for Portfolio Management',
    status: 'online',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      about: '/api/about',
      skills: '/api/skills',
      projects: '/api/projects',
      blogs: '/api/blogs',
      experience: '/api/experience',
      testimonials: '/api/testimonials',
      services: '/api/services',
      contact: '/api/contact',
      upload: '/api/upload'
    }
  });
});

module.exports = router;
