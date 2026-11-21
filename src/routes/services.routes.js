const express = require('express');
const {
  getServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/services.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getServices);
router.post('/', authenticate, createService);
router.put('/:id', authenticate, updateService);
router.delete('/:id', authenticate, deleteService);

module.exports = router;

