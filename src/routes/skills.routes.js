const express = require('express');
const { getSkills, createSkill, updateSkill, deleteSkill } = require('../controllers/skills.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getSkills);
router.post('/', authenticate, createSkill);
router.put('/:id', authenticate, updateSkill);
router.delete('/:id', authenticate, deleteSkill);

module.exports = router;
