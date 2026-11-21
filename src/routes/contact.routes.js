const express = require('express');
const {
  submitContact,
  getContactMessages,
  toggleMessageRead,
  deleteMessage
} = require('../controllers/contact.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', submitContact);
router.get('/', authenticate, getContactMessages);
router.patch('/:id/read', authenticate, toggleMessageRead);
router.delete('/:id', authenticate, deleteMessage);

module.exports = router;
