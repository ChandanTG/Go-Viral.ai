// controllers/authController.js – Authentication logic
const passport = require('passport');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateOTP, sendEmailOTP } = require('../utils/sendOtp');

// ─── Register ────────────────────────────────────────────────────────────────

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Create Account – Go Viral AI', errors: [], formData: {} });
};

exports.postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', {
      title: 'Create Account – Go Viral AI',
      errors: errors.array(),
      formData: req.body,
    });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Create Account – Go Viral AI',
        errors: [{ msg: 'An account with this email already exists.' }],
        formData: req.body,
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 90 * 1000); // 1 minute 30 seconds

    // Store in session
    req.session.pendingRegistration = {
      name,
      email: email.toLowerCase(),
      password,
      otp,
      otpExpiry
    };

    // Send OTP via Email
    try {
      await sendEmailOTP(email.toLowerCase(), otp);
      req.flash('success', `Verification code sent to ${email}`);
    } catch (e) {
      console.error('Email Error:', e);
      req.flash('success', `Verification code sent.`); // Show success anyway
    }

    res.redirect('/auth/register/otp');
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/auth/register');
  }
};

// ─── Register OTP Verification ───────────────────────────────────────────────

exports.getRegisterOTP = (req, res) => {
  if (!req.session.pendingRegistration) {
    return res.redirect('/auth/register');
  }
  res.render('auth/register-otp', {
    title: 'Verify Registration – Go Viral AI',
    error: req.flash('error'),
    success: req.flash('success'),
  });
};

exports.postRegisterOTP = async (req, res, next) => {
  const { otp } = req.body;
  const pendingUser = req.session.pendingRegistration;

  if (!pendingUser) {
    return res.redirect('/auth/register');
  }

  // Check if OTP matches and hasn't expired
  const now = new Date();
  if (pendingUser.otp !== otp || now > new Date(pendingUser.otpExpiry)) {
    return res.render('auth/register-otp', {
      title: 'Verify Registration – Go Viral AI',
      error: 'Invalid or expired OTP. Please try again.',
    });
  }

  try {
    // Check again just in case the user was created meanwhile
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      req.session.pendingRegistration = null;
      req.flash('error', 'Account already exists. Please login.');
      return res.redirect('/auth/login');
    }

    // Create the actual user
    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Schema hook will hash this
      otpVerified: true,
      lastLogin: new Date()
    });

    // Clear session data
    req.session.pendingRegistration = null;

    // Log the user in
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.otpVerified = true;
      req.flash('success', `Account created successfully! Welcome, ${user.name}!`);
      res.redirect('/dashboard');
    });

  } catch (err) {
    console.error('Register OTP Error:', err);
    req.flash('error', 'Failed to create account. Please try again.');
    res.redirect('/auth/register');
  }
};

exports.resendRegisterOTP = async (req, res) => {
  if (!req.session.pendingRegistration) {
    return res.redirect('/auth/register');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  req.session.pendingRegistration.otp = otp;
  req.session.pendingRegistration.otpExpiry = new Date(Date.now() + 90 * 1000);

  try {
    await sendEmailOTP(req.session.pendingRegistration.email, otp);
    req.flash('success', 'A new verification code has been sent to your email.');
  } catch (e) {
    console.error('Email Error:', e);
    req.flash('success', 'A new verification code has been sent.');
  }

  res.redirect('/auth/register/otp');
};

// ─── Login ───────────────────────────────────────────────────────────────────

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login – Go Viral AI', errors: [], formData: {} });
};

exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', {
      title: 'Login – Go Viral AI',
      errors: errors.array(),
      formData: req.body,
    });
  }

  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render('auth/login', {
        title: 'Login – Go Viral AI',
        errors: [{ msg: info.message }],
        formData: req.body,
      });
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      req.session.otpVerified = false;
      req.session.pendingUserId = user._id.toString();
      req.session.otpMethod = 'email'; // Set method to email by default

      // Generate and send OTP directly via email
      const otp = user.generateOTP();
      await user.save();

      try {
        await sendEmailOTP(user.email, otp);
        req.flash('success', `Email OTP sent to ${user.email}.`);
      } catch (e) {
        console.error('Email Error:', e);
        req.flash('success', `Email OTP sent.`); // Show success anyway in UI
      }

      res.redirect('/auth/otp');
    });
  })(req, res, next);
};

// ─── OTP Method Selection ──────────────────────────────────────────────────────

// ─── OTP Method Selection removed (Email only now) ──────────────────────────────────────────────────────

// ─── OTP Verification ─────────────────────────────────────────────────────────

exports.getOTP = (req, res) => {
  res.render('auth/otp', {
    title: 'Verify OTP – Go Viral AI',
    error: req.flash('error'),
    success: req.flash('success'),
  });
};

exports.postOTP = async (req, res) => {
  const { otp } = req.body;
  const user = req.user;

  let isValid = false;

  try {
    // Check against local database
    isValid = user.verifyOTP(otp);
  } catch (error) {
    console.error("OTP Verification Error:", error);
    isValid = false;
  }

  if (!isValid) {
    return res.render('auth/otp', {
      title: 'Verify OTP – Go Viral AI',
      error: 'Invalid or expired OTP. Please try again.',
    });
  }

  // Mark OTP verified
  user.otp = null;
  user.otpExpiry = null;
  user.otpVerified = true;
  user.lastLogin = new Date();
  await user.save();

  req.session.otpVerified = true;
  req.session.isTwilioVerify = null; // clear flag

  req.flash('success', `Welcome back, ${user.name}!`);

  if (user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/dashboard');
};

exports.resendOTP = async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/auth/login');

  const user = req.user;
  const otp = user.generateOTP();
  await user.save();

  try {
    await sendEmailOTP(user.email, otp);
    req.flash('success', `OTP resent to your email.`);
  } catch (e) {
    console.error('Email Error:', e);
    req.flash('success', `OTP resent.`);
  }

  res.redirect('/auth/otp');
};

// ─── Logout ───────────────────────────────────────────────────────────────────

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  });
};

// ─── Standalone API Endpoints (from Tutorial) ────────────────────────────────

// Store OTP temporarily (use DB in production)
let otpStore = {};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const otp = generateOTP();
    otpStore[email] = otp;

    await sendEmailOTP(email, otp);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }

  if (otpStore[email] == otp) {
    delete otpStore[email];
    return res.json({ success: true, message: "OTP Verified" });
  }

  res.status(400).json({ success: false, message: "Invalid OTP" });
};
// ─── Google OAuth ─────────────────────────────────────────────────────────────

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info ? info.message : 'Google authentication failed.');
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.otpVerified = true; // OAuth users skip OTP
      req.flash('success', `Signed in with Google. Welcome, ${user.name}!`);
      res.redirect('/dashboard');
    });
  })(req, res, next);
};

// ─── Apple OAuth ──────────────────────────────────────────────────────────────

exports.appleAuth = passport.authenticate('apple');

exports.appleCallback = (req, res, next) => {
  passport.authenticate('apple', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info ? info.message : 'Apple authentication failed.');
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.otpVerified = true; // OAuth users skip OTP
      req.flash('success', `Signed in with Apple. Welcome, ${user.name}!`);
      res.redirect('/dashboard');
    });
  })(req, res, next);
};
