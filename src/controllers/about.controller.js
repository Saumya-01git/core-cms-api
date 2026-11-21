const { prisma } = require('../config/db');

/**
 * @desc    Get About details
 * @route   GET /api/about
 * @access  Public
 */
const getAbout = async (req, res, next) => {
  try {
    let about = await prisma.about.findFirst();
    if (!about) {
      about = {
        title: 'Full Stack Engineer & Creative Developer',
        subtitle: 'Building exceptional digital experiences',
        bio: 'Passionate software developer focused on modern web engineering and bespoke digital solutions.',
        heroImage: null,
        resumeUrl: null,
        location: 'India',
        email: 'contact@example.com',
        phone: null,
        githubUrl: 'https://github.com',
        linkedinUrl: 'https://linkedin.com',
        twitterUrl: null,
        isPublished: true
      };
    }
    res.json({ success: true, data: about });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update About details
 * @route   PUT /api/about
 * @access  Private (Admin)
 */
const updateAbout = async (req, res, next) => {
  try {
    const existing = await prisma.about.findFirst();
    const {
      title, subtitle, bio, heroImage, resumeUrl, location,
      email, phone, githubUrl, linkedinUrl, twitterUrl, isPublished
    } = req.body;

    const data = {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(bio !== undefined && { bio }),
      ...(heroImage !== undefined && { heroImage }),
      ...(resumeUrl !== undefined && { resumeUrl }),
      ...(location !== undefined && { location }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(githubUrl !== undefined && { githubUrl }),
      ...(linkedinUrl !== undefined && { linkedinUrl }),
      ...(twitterUrl !== undefined && { twitterUrl }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) })
    };

    let result;
    if (existing) {
      result = await prisma.about.update({
        where: { id: existing.id },
        data
      });
    } else {
      result = await prisma.about.create({
        data: {
          title: title || 'Full Stack Engineer',
          bio: bio || 'Welcome to my portfolio.',
          ...data
        }
      });
    }

    res.json({
      success: true,
      message: 'About profile updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAbout,
  updateAbout
};

