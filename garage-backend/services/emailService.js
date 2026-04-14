import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter;

async function initTransporter() {
  if (transporter) return transporter;

  // Use test ethereal account by default for development
  let testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || testAccount.user,
      pass: process.env.SMTP_PASS || testAccount.pass,
    },
  });

  return transporter;
}

export const sendTemporaryPasswordEmail = async (email, name, password) => {
  try {
    const mailer = await initTransporter();

    const info = await mailer.sendMail({
      from: '"Garage Management System" <no-reply@gms.com>',
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

    logger.info(`Message sent: ${info.messageId}`);
    
    // For ethereal test accounts, print the preview URL automatically!
    if (!process.env.SMTP_HOST) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log("-----------------------------------------");
        console.log(`[EMAIL PREVIEW URL]: ${nodemailer.getTestMessageUrl(info)}`);
        console.log("-----------------------------------------");
    }

    return true;
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    // We shouldn't crash the mechanic creation just because an email failed during dev
    console.error("Email simulation failed:", error);
    return false;
  }
};
