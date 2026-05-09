// routes/auth.js – Authentication routes
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { ensureGuest, ensureOTPPending } = require('../middlewares/auth');

// Register
router.get('/register', ensureGuest, authController.getRegister);
router.post('/register', ensureGuest, [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
], authController.postRegister);

// Register OTP
router.get('/register/otp', ensureGuest, authController.getRegisterOTP);
router.post('/register/otp', ensureGuest, authController.postRegisterOTP);
router.get('/register/resend', ensureGuest, authController.resendRegisterOTP);

// Login
router.get('/login', ensureGuest, authController.getLogin);
router.post('/login', ensureGuest, [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], authController.postLogin);

// OTP Verification
router.get('/otp', ensureOTPPending, authController.getOTP);
router.post('/otp', ensureOTPPending, authController.postOTP);
router.get('/otp/resend', ensureOTPPending, authController.resendOTP);

// Logout
router.get('/logout', authController.logout);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// ─── Apple OAuth ──────────────────────────────────────────────────────────────
router.get('/apple', authController.appleAuth);
router.post('/apple/callback', authController.appleCallback);

// ─── Standalone API Endpoints (from Tutorial) ────────────────────────────────
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
