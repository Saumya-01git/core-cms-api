const express = require('express');
const { getAbout, updateAbout } = require('../controllers/about.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getAbout);
router.put('/', authenticate, updateAbout);

module.exports = router;

