module.exports = {
  ...require('./query.service'),
  ...require('./fileUpload.service'),
  ...require('./notification.service'),
  ...require('./cron.service'),
};
