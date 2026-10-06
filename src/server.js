const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = config.port;

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Start HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Core CMS API server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received. Closing HTTP server & database connection...`);
      server.close(async () => {
        await disconnectDB();
        console.log('✅ Server terminated cleanly');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
