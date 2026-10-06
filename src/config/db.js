const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

/**
 * Test PostgreSQL database connectivity
 */
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully via Prisma');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect Prisma client gracefully
 */
const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log('🔌 PostgreSQL database disconnected');
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB
};
