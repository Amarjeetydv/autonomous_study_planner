module.exports = {
  env: require('./env'),
  logger: require('./logger'),
  connectDB: require('./db'),
  cloudinary: require('./cloudinary'),
  sendMail: require('./mail').sendMail,
};
