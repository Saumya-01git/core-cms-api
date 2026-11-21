const express = require('express');
const {
  getProjects,
  getProjectByIdOrSlug,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projects.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getProjects);
router.get('/:idOrSlug', getProjectByIdOrSlug);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

module.exports = router;

