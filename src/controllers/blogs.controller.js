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
 * @desc    Get all blogs (public gets published, admin can request all)
 * @route   GET /api/blogs
 * @access  Public
 */
const getBlogs = async (req, res, next) => {
  try {
    const { tag, all } = req.query;
    const where = {};

    // Default to published unless explicitly requested
    if (all !== 'true') {
      where.isPublished = true;
    }
    if (tag) {
      where.tags = { has: tag };
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single blog by slug (and increment views)
 * @route   GET /api/blogs/:slug
 * @access  Public
 */
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { slug }
    });

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Increment views count asynchronously
    await prisma.blog.update({
      where: { id: blog.id },
      data: { views: { increment: 1 } }
    });

    res.json({ success: true, data: { ...blog, views: blog.views + 1 } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new blog post
 * @route   POST /api/blogs
 * @access  Private (Admin)
 */
const createBlog = async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, coverImage, tags, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.'
      });
    }

    let finalSlug = slug ? generateSlug(slug) : generateSlug(title);
    const existingSlug = await prisma.blog.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt ? excerpt.trim() : title.trim(),
        content,
        coverImage: coverImage || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date() : null
      }
    });

    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update blog post
 * @route   PUT /api/blogs/:id
 * @access  Private (Admin)
 */
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, coverImage, tags, isPublished } = req.body;

    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (slug !== undefined) data.slug = generateSlug(slug);
    if (excerpt !== undefined) data.excerpt = excerpt.trim();
    if (content !== undefined) data.content = content;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (tags !== undefined) {
      data.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (isPublished !== undefined) {
      data.isPublished = Boolean(isPublished);
      if (isPublished && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updated = await prisma.blog.update({
      where: { id },
      data
    });

    res.json({ success: true, message: 'Blog updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete blog post
 * @route   DELETE /api/blogs/:id
 * @access  Private (Admin)
 */
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    await prisma.blog.delete({ where: { id } });
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
};
