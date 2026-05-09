// config/mailer.js – Nodemailer transporter setup
const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Development fallback
    console.log('⚙️ Creating Ethereal test account for emails...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✉️ Ethereal Email Ready: ', testAccount.user);
  }
  return transporter;
};

/**
 * Send OTP email to user
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 */
const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Go Viral AI" <${process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com' ? process.env.EMAIL_USER : 'no-reply@goviral.ai'}>`,
    to,
    subject: '🔐 Your Login OTP – Go Viral AI',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(135deg, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Go Viral AI</h1>
          <p style="color: #888; margin-top: 8px;">Content Virality Analyzer</p>
        </div>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 30px; text-align: center;">
          <p style="color: #ccc; margin-bottom: 20px;">Your login OTP is:</p>
          <div style="background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2)); border: 2px solid rgba(168,85,247,0.5); border-radius: 12px; padding: 20px; display: inline-block;">
            <span style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #a855f7;">${otp}</span>
          </div>
          <p style="color: #888; margin-top: 20px; font-size: 14px;">⏰ This OTP expires in <strong style="color: #f59e0b;">5 minutes</strong></p>
          <p style="color: #666; font-size: 12px; margin-top: 10px;">If you didn't request this, please ignore this email.</p>
        </div>
        <p style="color: #444; text-align: center; font-size: 12px; margin-top: 20px;">© 2024 Go Viral AI. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const tp = await getTransporter();
    const info = await tp.sendMail(mailOptions);
    console.log(`📧 OTP sent to ${to}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Preview URL: ${previewUrl}`);
    }
  } catch (err) {
    console.log(`⚠️ Email failed, OTP for ${to}: ${otp} | Error: ${err.message}`);
  }
};

module.exports = { sendOTPEmail };
