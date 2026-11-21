const { prisma } = require('../config/db');

/**
 * @desc    Get all skills
 * @route   GET /api/skills
 * @access  Public
 */
const getSkills = async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = category ? { category: { equals: category, mode: 'insensitive' } } : {};

    const skills = await prisma.skill.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, count: skills.length, data: skills });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new skill
 * @route   POST /api/skills
 * @access  Private (Admin)
 */
const createSkill = async (req, res, next) => {
  try {
    const { name, category, proficiency, icon, order } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required.'
      });
    }

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        proficiency: proficiency !== undefined ? parseInt(proficiency, 10) : 80,
        icon: icon || null,
        order: order !== undefined ? parseInt(order, 10) : 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: skill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a skill
 * @route   PUT /api/skills/:id
 * @access  Private (Admin)
 */
const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, proficiency, icon, order } = req.body;

    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category: category.trim() }),
        ...(proficiency !== undefined && { proficiency: parseInt(proficiency, 10) }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order: parseInt(order, 10) })
      }
    });

    res.json({ success: true, message: 'Skill updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a skill
 * @route   DELETE /api/skills/:id
 * @access  Private (Admin)
 */
const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    await prisma.skill.delete({ where: { id } });
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill
};
