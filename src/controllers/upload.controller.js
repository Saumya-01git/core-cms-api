const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/db');

/**
 * @desc    Upload single image
 * @route   POST /api/upload
 * @access  Private (Admin)
 */
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please attach an image under the "file" or "image" field.'
      });
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;

    // Record in database
    const media = await prisma.media.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        path: file.path
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: media.id,
        filename: media.filename,
        url: media.url,
        size: media.size,
        mimeType: media.mimeType
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/multiple
 * @access  Private (Admin)
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided.'
      });
    }

    const createdRecords = [];

    for (const file of req.files) {
      const fileUrl = `/uploads/${file.filename}`;
      const media = await prisma.media.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: fileUrl,
          path: file.path
        }
      });
      createdRecords.push({
        id: media.id,
        filename: media.filename,
        url: media.url,
        size: media.size,
        mimeType: media.mimeType
      });
    }

    res.status(201).json({
      success: true,
      message: `${createdRecords.length} files uploaded successfully`,
      data: createdRecords
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all uploaded media library
 * @route   GET /api/upload
 * @access  Private (Admin)
 */
const getMediaList = async (req, res, next) => {
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: media.length,
      data: media
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete media file from disk & database
 * @route   DELETE /api/upload/:id
 * @access  Private (Admin)
 */
const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media record not found.' });
    }

    // Delete file from disk if present
    if (fs.existsSync(media.path)) {
      try {
        fs.unlinkSync(media.path);
      } catch (err) {
        console.warn(`Could not delete file from disk: ${media.path}`, err.message);
      }
    }

    await prisma.media.delete({ where: { id } });

    res.json({ success: true, message: 'Media file deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getMediaList,
  deleteMedia
};

