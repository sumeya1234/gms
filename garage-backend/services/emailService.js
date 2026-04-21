import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter;

async function initTransporter() {
    if (transporter) return transporter;

    // Configuration for your real Gmail account
    transporter = nodemailer.createTransport({
  service: 'gmail', // This shortcut handles host/port/secure for you
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // This allows the connection even if the local SSL certificate isn't perfect
    rejectUnauthorized: false 
  }
});
    // Verify connection immediately
    try {
      await transporter.verify();
      logger.info("SMTP Transporter is ready to send emails");
    } catch (err) {
      logger.error(`SMTP Connection Error: ${err.message}`);
    }

    return transporter;
  }

export const sendTemporaryPasswordEmail = async (email, name, password) => {
  try {
    const mailer = await initTransporter();

    const info = await mailer.sendMail({
      from: `"Garage Management System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Mechanic Account Details",
      text: `Hello ${name},\n\nA mechanic account has been created for you.\nYour temporary password is: ${password}\n\nPlease log in and update your password immediately.\n\nBest regards,\nGMS Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1890ff;">Welcome to Garage Management System</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>A mechanic account has been provisioned for you.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p>Please log in to the mechanic portal and change your password as soon as possible.</p>
          <br/>
          <p>Best regards,<br/>GMS Team</p>
        </div>
      `,
    });

    logger.info(`Email successfully sent to ${email}. Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${email}: ${error.message}`);
    console.error("Email sending failed:", error);
    return false;
  }
};

export const sendPasswordResetOTP = async (email, otp) => {
  try {
    const mailer = await initTransporter();

    const info = await mailer.sendMail({
      from: `"Garage Management System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request - GMS",
      text: `Hello,\n\nYou have requested to reset your password. Your 6-digit verification code is: ${otp}\n\nThis code is valid for 15 minutes.\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nGMS Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1890ff;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have recently requested to reset your password for your Garage Management System account.</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #1890ff;">
            ${otp}
          </div>
          <p>This code is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <br/>
          <p>Best regards,<br/>GMS Team</p>
        </div>
      `,
    });

    logger.info(`Password reset OTP email sent to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
    console.error("Password reset email sending failed:", error);
    return false;
  }
};
