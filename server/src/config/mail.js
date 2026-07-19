const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter = null;

const isPlaceholder = (val) => !val || val.includes('your_') || val.includes('replace_');

if (env.smtp.host && env.smtp.user && env.smtp.pass && !isPlaceholder(env.smtp.user) && !isPlaceholder(env.smtp.pass)) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port || 587,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.info('Mail transport is not configured. Email content logged instead.', { to, subject, text });
    return { mocked: true };
  }

  return transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
};

module.exports = { sendMail };
