const express = require('express');
const {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonials.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getTestimonials);
router.post('/', authenticate, createTestimonial);
router.put('/:id', authenticate, updateTestimonial);
router.delete('/:id', authenticate, deleteTestimonial);

module.exports = router;
