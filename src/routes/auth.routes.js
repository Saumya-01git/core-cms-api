const express = require('express');
const { login, refreshToken, getMe, updateMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (Requires Bearer token)
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

module.exports = router;
