const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

const isPlaceholder = (val) => !val || val.includes('your_') || val.includes('replace_') || val.includes('fake_');

// Safely log SMTP env status at startup
logger.info('📧 SMTP Configuration Audit:');
logger.info(`  SMTP_HOST: ${env.smtp.host || '(not set)'}`);
logger.info(`  SMTP_PORT: ${env.smtp.port || '(not set)'}`);
logger.info(`  SMTP_SECURE: ${env.smtp.secure}`);
logger.info(`  SMTP_USER: ${env.smtp.user || '(not set)'}`);
logger.info(`  SMTP_PASS: ${env.smtp.pass && !isPlaceholder(env.smtp.pass) ? 'Loaded ✅' : 'Missing ❌'}`);
logger.info(`  SMTP_FROM_EMAIL: ${env.smtp.from || '(not set)'}`);

let transporter = null;
let isVerified = false;

const createExplicitTransporter = () => {
  const { host, port, user, pass, secure } = env.smtp;

  if (!user || !pass || isPlaceholder(user) || isPlaceholder(pass)) {
    logger.warn('⚠️ SMTP Warning: Credentials (SMTP_USER/SMTP_PASS) missing or set to placeholder. Email sending will be simulated.');
    return null;
  }

  const explicitPort = Number(port) || 465;
  const isSecure = secure !== undefined ? Boolean(secure) : explicitPort === 465;

  const config = {
    host: host || 'smtp.gmail.com',
    port: explicitPort,
    secure: isSecure,
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
    tls: {
      rejectUnauthorized: false,
    },
  };

  return nodemailer.createTransport(config);
};

transporter = createExplicitTransporter();

// Verify transporter asynchronously at startup
const verifyTransporter = async () => {
  if (!transporter) return false;
  try {
    await transporter.verify();
    isVerified = true;
    logger.info('✅ SMTP Connected & Verified Successfully');
    return true;
  } catch (error) {
    isVerified = false;
    logger.error('❌ SMTP Connection Verification Failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    return false;
  }
};

// Trigger immediate verify
if (transporter) {
  verifyTransporter();
}

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    transporter = createExplicitTransporter();
    if (transporter) {
      await verifyTransporter();
    }
  }

  if (!transporter) {
    logger.info('ℹ️ Email dispatch simulated (SMTP unconfigured):', { to, subject });
    return { mocked: true };
  }

  console.log(`Sending email to ${to}...`);

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from || env.smtp.user,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent successfully.');
    logger.info('✅ Email Sent Successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return info;
  } catch (error) {
    console.error('❌ SMTP Error sending email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    logger.error('❌ Email Dispatch Failed:', {
      recipient: to,
      subject,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = { sendMail, verifyTransporter };


