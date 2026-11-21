const { prisma } = require('../config/db');

/**
 * @desc    Submit contact message
 * @route   POST /api/contact
 * @access  Public
 */
const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : null,
        message: message.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! It has been received.',
      data: {
        id: savedMessage.id,
        createdAt: savedMessage.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all contact messages (Admin inbox)
 * @route   GET /api/contact
 * @access  Private (Admin)
 */
const getContactMessages = async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark message as read/unread
 * @route   PATCH /api/contact/:id/read
 * @access  Private (Admin)
 */
const toggleMessageRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: isRead !== undefined ? Boolean(isRead) : true }
    });

    res.json({ success: true, message: 'Message status updated', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete message
 * @route   DELETE /api/contact/:id
 * @access  Private (Admin)
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await prisma.message.delete({ where: { id } });
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContact,
  getContactMessages,
  toggleMessageRead,
  deleteMessage
};
