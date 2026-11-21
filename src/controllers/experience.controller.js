const { prisma } = require('../config/db');

/**
 * @desc    Get all experience / timeline records
 * @route   GET /api/experience
 * @access  Public
 */
const getExperiences = async (req, res, next) => {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: [{ order: 'asc' }, { startDate: 'desc' }]
    });

    res.json({ success: true, count: experiences.length, data: experiences });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new experience entry
 * @route   POST /api/experience
 * @access  Private (Admin)
 */
const createExperience = async (req, res, next) => {
  try {
    const {
      role, company, companyUrl, location, startDate, endDate, isCurrent, description, highlights, order
    } = req.body;

    if (!role || !company || !startDate || !description) {
      return res.status(400).json({
        success: false,
        message: 'Role, company, startDate and description are required.'
      });
    }

    const exp = await prisma.experience.create({
      data: {
        role: role.trim(),
        company: company.trim(),
        companyUrl: companyUrl || null,
        location: location || null,
        startDate: startDate.trim(),
        endDate: isCurrent ? null : (endDate || null),
        isCurrent: Boolean(isCurrent),
        description: description.trim(),
        highlights: Array.isArray(highlights) ? highlights : (highlights ? highlights.split('\n').filter(Boolean) : []),
        order: order !== undefined ? parseInt(order, 10) : 0
      }
    });

    res.status(201).json({ success: true, message: 'Experience added successfully', data: exp });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update experience entry
 * @route   PUT /api/experience/:id
 * @access  Private (Admin)
 */
const updateExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      role, company, companyUrl, location, startDate, endDate, isCurrent, description, highlights, order
    } = req.body;

    const existing = await prisma.experience.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Experience entry not found' });
    }

    const data = {};
    if (role !== undefined) data.role = role.trim();
    if (company !== undefined) data.company = company.trim();
    if (companyUrl !== undefined) data.companyUrl = companyUrl;
    if (location !== undefined) data.location = location;
    if (startDate !== undefined) data.startDate = startDate.trim();
    if (endDate !== undefined) data.endDate = endDate;
    if (isCurrent !== undefined) {
      data.isCurrent = Boolean(isCurrent);
      if (data.isCurrent) data.endDate = null;
    }
    if (description !== undefined) data.description = description.trim();
    if (highlights !== undefined) {
      data.highlights = Array.isArray(highlights) ? highlights : highlights.split('\n').filter(Boolean);
    }
    if (order !== undefined) data.order = parseInt(order, 10);

    const updated = await prisma.experience.update({
      where: { id },
      data
    });

    res.json({ success: true, message: 'Experience updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete experience entry
 * @route   DELETE /api/experience/:id
 * @access  Private (Admin)
 */
const deleteExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.experience.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Experience entry not found' });
    }

    await prisma.experience.delete({ where: { id } });
    res.json({ success: true, message: 'Experience deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience
};
