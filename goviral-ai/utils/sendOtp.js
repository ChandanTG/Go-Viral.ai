const nodemailer = require("nodemailer");

// ─── Email OTP via Gmail ──────────────────────────────────────────────────────
const sendEmailOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Go Viral AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Your OTP Code – Go Viral AI",
    text: `Your OTP is ${otp}. It expires in 1 minute 30 seconds. Do not share this with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0a0a0f; color: #fff; padding: 40px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
        <h2 style="background: linear-gradient(135deg, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Go Viral AI</h2>
        <p style="color: #ccc;">Your one-time OTP for login is:</p>
        <div style="background: rgba(168,85,247,0.15); border: 2px solid #a855f7; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #a855f7;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">⏰ Expires in <strong style="color:#f59e0b;">1 minute 30 seconds</strong>. Do not share this with anyone.</p>
      </div>
    `,
  });
};

// ─── OTP Generator ────────────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { generateOTP, sendEmailOTP };

