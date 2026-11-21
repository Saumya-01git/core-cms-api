const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const aboutRoutes = require('./about.routes');
const skillsRoutes = require('./skills.routes');
const projectsRoutes = require('./projects.routes');
const blogsRoutes = require('./blogs.routes');
const experienceRoutes = require('./experience.routes');
const testimonialsRoutes = require('./testimonials.routes');
const servicesRoutes = require('./services.routes');
const contactRoutes = require('./contact.routes');

const router = express.Router();

// Mount Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/about', aboutRoutes);
router.use('/skills', skillsRoutes);
router.use('/projects', projectsRoutes);
router.use('/blogs', blogsRoutes);
router.use('/experience', experienceRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/services', servicesRoutes);
router.use('/contact', contactRoutes);

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
