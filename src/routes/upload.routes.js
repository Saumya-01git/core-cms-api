const express = require('express');
const upload = require('../middleware/upload.middleware');
const {
  uploadSingle,
  uploadMultiple,
  getMediaList,
  deleteMedia
} = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All upload routes are protected for Admin CMS
router.use(authenticate);

// Single upload accepts 'file' or 'image'
router.post('/', upload.single('file'), uploadSingle);
router.post('/image', upload.single('image'), uploadSingle);
router.post('/multiple', upload.array('files', 10), uploadMultiple);

router.get('/', getMediaList);
router.delete('/:id', deleteMedia);

module.exports = router;

