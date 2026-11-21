const { prisma } = require('../config/db');

/**
 * @desc    Get testimonials (public gets approved, admin can view all)
 * @route   GET /api/testimonials
 * @access  Public
 */
const getTestimonials = async (req, res, next) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? {} : { isApproved: true };

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, count: testimonials.length, data: testimonials });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new testimonial
 * @route   POST /api/testimonials
 * @access  Private (Admin)
 */
const createTestimonial = async (req, res, next) => {
  try {
    const { authorName, authorRole, company, avatarUrl, content, rating, order, isApproved } = req.body;

    if (!authorName || !authorRole || !content) {
      return res.status(400).json({
        success: false,
        message: 'Author name, role, and content are required.'
      });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        authorName: authorName.trim(),
        authorRole: authorRole.trim(),
        company: company || null,
        avatarUrl: avatarUrl || null,
        content: content.trim(),
        rating: rating !== undefined ? parseInt(rating, 10) : 5,
        order: order !== undefined ? parseInt(order, 10) : 0,
        isApproved: isApproved !== undefined ? Boolean(isApproved) : true
      }
    });

    res.status(201).json({ success: true, message: 'Testimonial created successfully', data: testimonial });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update testimonial
 * @route   PUT /api/testimonials/:id
 * @access  Private (Admin)
 */
const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { authorName, authorRole, company, avatarUrl, content, rating, order, isApproved } = req.body;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    const data = {};
    if (authorName !== undefined) data.authorName = authorName.trim();
    if (authorRole !== undefined) data.authorRole = authorRole.trim();
    if (company !== undefined) data.company = company;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (content !== undefined) data.content = content.trim();
    if (rating !== undefined) data.rating = parseInt(rating, 10);
    if (order !== undefined) data.order = parseInt(order, 10);
    if (isApproved !== undefined) data.isApproved = Boolean(isApproved);

    const updated = await prisma.testimonial.update({
      where: { id },
      data
    });

    res.json({ success: true, message: 'Testimonial updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete testimonial
 * @route   DELETE /api/testimonials/:id
 * @access  Private (Admin)
 */
const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    await prisma.testimonial.delete({ where: { id } });
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
