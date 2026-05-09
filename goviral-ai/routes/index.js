// routes/index.js – Public landing page
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.isAuthenticated() && req.session.otpVerified) {
    return res.redirect('/dashboard');
  }
  res.render('index', { title: 'Go Viral AI – Content Virality Analyzer' });
});

module.exports = router;
