const env = require('../../config/env');
const { sendMail } = require('../../config/mail');

const getCleanFrontendUrl = () => (env.frontendUrl || 'http://localhost:3000').replace(/\/+$/, '');

const buildVerificationMessage = (token, user) => {
  const baseUrl = getCleanFrontendUrl();
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const name = user.name || 'User';

  const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
    <!-- Logo / Branding -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px;">🎓 Autonomous Study Planner</span>
    </div>
    
    <!-- Title / Welcome -->
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center;">Welcome, ${name}!</h2>
    
    <!-- Body -->
    <p style="font-size: 15px; color: #475569; margin-bottom: 24px; text-align: center; line-height: 1.6;">
      Thank you for registering for Autonomous Study Planner. To start planning your adaptive study journey, please verify your email address.
    </p>
    
    <!-- Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${verificationUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">Verify Email</a>
    </div>
    
    <!-- Expiration -->
    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 32px;">
      This verification link is valid for <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
    </p>
    
    <!-- Divider -->
    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
    
    <!-- Fallback link -->
    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0; word-break: break-all; text-align: center;">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${verificationUrl}" style="color: #6366f1; text-decoration: underline;">${verificationUrl}</a>
    </p>
    
    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8;">
      Need help? Contact support at <a href="mailto:support@studypilot.com" style="color: #6366f1; text-decoration: underline;">support@studypilot.com</a>.
    </div>
  </div>
</div>
`.trim();

  return {
    subject: 'Verify your Autonomous Study Planner email address',
    text: `Hello ${name},\n\nThank you for registering at Autonomous Study Planner. Please verify your email using the link below:\n\n${verificationUrl}\n\nThis link is valid for 24 hours.`,
    html,
  };
};

const buildPasswordResetMessage = (token, email) => {
  const baseUrl = getCleanFrontendUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px;">🎓 Autonomous Study Planner</span>
    </div>
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center;">Reset Your Password</h2>
    <p style="font-size: 15px; color: #475569; margin-bottom: 24px; text-align: center; line-height: 1.6;">
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-size: 15px; font-weight: 600;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 32px;">
      This link is valid for <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
    </p>
    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0; word-break: break-all; text-align: center;">
      URL: <a href="${resetUrl}" style="color: #6366f1; text-decoration: underline;">${resetUrl}</a>
    </p>
  </div>
</div>
`.trim();

  return {
    subject: 'Reset your Autonomous Study Planner password',
    text: `We received a password reset request for your account. Use this link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`,
    html,
  };
};

const sendVerificationEmail = async (user, token) => {
  const message = buildVerificationMessage(token, user);

  return sendMail({
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const message = buildPasswordResetMessage(token, user.email);

  return sendMail({
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
