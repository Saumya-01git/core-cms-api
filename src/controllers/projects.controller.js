const { prisma } = require('../config/db');

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * @desc    Get all projects (with optional featured / tag filter)
 * @route   GET /api/projects
 * @access  Public
 */
const getProjects = async (req, res, next) => {
  try {
    const { featured, tag, limit } = req.query;
    const where = {};

    if (featured !== undefined) {
      where.isFeatured = featured === 'true';
    }
    if (tag) {
      where.tags = { has: tag };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit ? parseInt(limit, 10) : undefined
    });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project by ID or slug
 * @route   GET /api/projects/:idOrSlug
 * @access  Public
 */
const getProjectByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Admin)
 */
const createProject = async (req, res, next) => {
  try {
    const {
      title, slug, description, content, coverImage, tags, demoUrl, githubUrl, isFeatured, order
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required.'
      });
    }

    let finalSlug = slug ? generateSlug(slug) : generateSlug(title);
    
    // Check slug collision
    const existingSlug = await prisma.project.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        content: content || null,
        coverImage: coverImage || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        demoUrl: demoUrl || null,
        githubUrl: githubUrl || null,
        isFeatured: Boolean(isFeatured),
        order: order !== undefined ? parseInt(order, 10) : 0
      }
    });

    res.status(201).json({ success: true, message: 'Project created successfully', data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin)
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, slug, description, content, coverImage, tags, demoUrl, githubUrl, isFeatured, order
    } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (slug !== undefined) data.slug = generateSlug(slug);
    if (description !== undefined) data.description = description.trim();
    if (content !== undefined) data.content = content;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (tags !== undefined) {
      data.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (demoUrl !== undefined) data.demoUrl = demoUrl;
    if (githubUrl !== undefined) data.githubUrl = githubUrl;
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
    if (order !== undefined) data.order = parseInt(order, 10);

    const updated = await prisma.project.update({
      where: { id },
      data
    });

    res.json({ success: true, message: 'Project updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin)
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectByIdOrSlug,
  createProject,
  updateProject,
  deleteProject
};

