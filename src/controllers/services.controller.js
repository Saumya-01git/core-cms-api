const { prisma } = require('../config/db');

/**
 * @desc    Get services
 * @route   GET /api/services
 * @access  Public
 */
const getServices = async (req, res, next) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? {} : { isActive: true };

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private (Admin)
 */
const createService = async (req, res, next) => {
  try {
    const { title, description, icon, features, order, isActive } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required.'
      });
    }

    const service = await prisma.service.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        icon: icon || null,
        features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : []),
        order: order !== undefined ? parseInt(order, 10) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json({ success: true, message: 'Service created successfully', data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private (Admin)
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, icon, features, order, isActive } = req.body;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description.trim();
    if (icon !== undefined) data.icon = icon;
    if (features !== undefined) {
      data.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
    }
    if (order !== undefined) data.order = parseInt(order, 10);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.service.update({
      where: { id },
      data
    });

    res.json({ success: true, message: 'Service updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private (Admin)
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await prisma.service.delete({ where: { id } });
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService
};

