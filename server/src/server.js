const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./config/logger');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      logger.info('🚀 Server Startup Complete:');
      logger.info(`  Node Environment: ${env.nodeEnv}`);
      logger.info(`  API URL / Port:   http://localhost:${env.port}`);
      logger.info(`  Frontend URL:     ${process.env.FRONTEND_URL || env.frontendUrl}`);
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
};

startServer();
