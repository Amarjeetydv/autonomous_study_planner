const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('MongoDB connected successfully');

    // Clean up obsolete unique indexes on Goals collection that block multiple active goals
    try {
      const goalsCollection = mongoose.connection.collection('Goals');
      const indexes = await goalsCollection.indexes();
      for (const idx of indexes) {
        if (idx.unique && (idx.name.includes('studentId') || idx.name.includes('goalType'))) {
          logger.info(`Dropping legacy unique index from Goals collection: ${idx.name}`);
          await goalsCollection.dropIndex(idx.name);
        }
      }
    } catch (indexErr) {
      logger.warn('Index migration check finished', { message: indexErr.message });
    }
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    throw error;
  }
};

module.exports = connectDB;
