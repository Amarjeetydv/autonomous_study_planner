const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter = null;

const isPlaceholder = (val) => !val || val.includes('your_') || val.includes('replace_') || val.includes('fake_');

const initializeTransporter = () => {
  const { host, port, user, pass, secure } = env.smtp;

  if (!user || !pass || isPlaceholder(user) || isPlaceholder(pass)) {
    logger.warn('⚠️ SMTP Warning: Credentials (SMTP_USER/SMTP_PASS) missing or set to placeholder. Email sending will be simulated.');
    return null;
  }

  const isGmail = (host && host.includes('gmail')) || user.includes('@gmail.com');

  try {
    const config = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host: host || 'smtp.gmail.com',
          port: Number(port) || 587,
          secure: secure || Number(port) === 465,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
          },
        };

    const mailTransporter = nodemailer.createTransport(config);
    logger.info(`📧 SMTP Transporter initialized successfully (${isGmail ? 'Gmail Service' : host}).`);
    return mailTransporter;
  } catch (err) {
    logger.error('❌ Failed to initialize Nodemailer transporter:', { error: err.message });
    return null;
  }
};

transporter = initializeTransporter();

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    logger.info('ℹ️ Email dispatch simulated (SMTP unconfigured):', { to, subject });
    return { mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from || env.smtp.user || 'no-reply@studypilot.com',
      to,
      subject,
      html,
      text,
    });
    logger.info('✅ Email sent successfully:', { messageId: info.messageId, to });
    return info;
  } catch (error) {
    logger.error('❌ Failed to send email via SMTP:', { to, subject, error: error.message });
    throw error;
  }
};

module.exports = { sendMail };

