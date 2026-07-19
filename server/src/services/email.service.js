const env = require('../config/env');
const { sendMail } = require('../config/mail');
const { EMAIL_SUBJECTS } = require('../constants');

const buildHtmlEmail = ({ title, heading, body, actionText, actionUrl }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background: #f9fafb; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
      <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827;">${title}</h1>
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #374151;">${heading}</h2>
      <p style="margin: 0 0 24px; color: #4b5563;">${body}</p>
      ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:600;">${actionText}</a>` : ''}
      <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">Autonomous Study Planner</p>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, text, html }) => sendMail({ to, subject, text, html });

const sendWelcomeEmail = async ({ to, name = 'User' }) => {
  const subject = EMAIL_SUBJECTS.WELCOME;
  const actionUrl = env.frontendUrl;
  const html = buildHtmlEmail({
    title: 'Welcome to Autonomous Study Planner',
    heading: `Hello ${name}, welcome aboard.`,
    body: 'Your account is ready. Start by verifying your email and setting up your study goals.',
    actionText: 'Open Dashboard',
    actionUrl,
  });

  return sendEmail({
    to,
    subject,
    text: `Welcome ${name} to Autonomous Study Planner. Visit ${actionUrl} to get started.`,
    html,
  });
};

const sendVerificationEmail = async ({ to, name = 'User', token }) => {
  const verificationUrl = `${env.frontendUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
  const subject = EMAIL_SUBJECTS.EMAIL_VERIFICATION;
  const html = buildHtmlEmail({
    title: 'Verify your email address',
    heading: `Hi ${name}, confirm your email to continue.`,
    body: `Use this verification token: ${token}`,
    actionText: 'Verify Email',
    actionUrl: verificationUrl,
  });

  return sendEmail({
    to,
    subject,
    text: `Use token ${token} or open ${verificationUrl}`,
    html,
  });
};

const sendPasswordResetEmail = async ({ to, name = 'User', token }) => {
  const resetUrl = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
  const subject = EMAIL_SUBJECTS.PASSWORD_RESET;
  const html = buildHtmlEmail({
    title: 'Reset your password',
    heading: `Hi ${name}, we received a password reset request.`,
    body: `Reset token: ${token}`,
    actionText: 'Reset Password',
    actionUrl: resetUrl,
  });

  return sendEmail({
    to,
    subject,
    text: `Reset token ${token}. Open ${resetUrl}`,
    html,
  });
};

module.exports = {
  buildHtmlEmail,
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
