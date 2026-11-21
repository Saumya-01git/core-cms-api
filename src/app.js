const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (config.corsOrigin.includes('*') || config.corsOrigin.includes(origin)) {
      return callback(null, true);
    }
    // In development allow any origin
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// HTTP request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded media
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// Static directory for Custom Headless CMS Admin Panel UI
const adminStaticPath = path.resolve(__dirname, '../admin');
app.use('/admin', express.static(adminStaticPath));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminStaticPath, 'index.html'));
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Core CMS REST API',
    adminPanel: '/admin',
    documentation: '/api',
    health: '/api/health'
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
