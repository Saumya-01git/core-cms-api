const express = require('express');
const {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience
} = require('../controllers/experience.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getExperiences);
router.post('/', authenticate, createExperience);
router.put('/:id', authenticate, updateExperience);
router.delete('/:id', authenticate, deleteExperience);

module.exports = router;

