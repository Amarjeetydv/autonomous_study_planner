module.exports = {
  ...require('./query.service'),
  ...require('./fileUpload.service'),
  ...require('./email.service'),
  ...require('./notification.service'),
  ...require('./cron.service'),
};
