// middlewares/auth.js – Authentication & Authorization middleware

/**
 * Ensure user is authenticated via session
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.session.otpVerified) {
    return next();
  }
  req.flash('error', 'Please login to access this page.');
  res.redirect('/auth/login');
};

/**
 * Ensure user is a guest (not logged in)
 */
const ensureGuest = (req, res, next) => {
  if (req.isAuthenticated() && req.session.otpVerified) {
    return res.redirect('/dashboard');
  }
  next();
};

/**
 * Ensure user is admin
 */
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.session.otpVerified && req.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Admin only.');
  res.redirect('/dashboard');
};

/**
 * Ensure passport authenticated but OTP not yet verified
 */
const ensureOTPPending = (req, res, next) => {
  if (req.isAuthenticated() && !req.session.otpVerified) {
    return next();
  }
  res.redirect('/auth/login');
};

module.exports = { ensureAuthenticated, ensureGuest, ensureAdmin, ensureOTPPending };
