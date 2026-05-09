// routes/dashboard.js – Dashboard routes
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/', ensureAuthenticated, dashboardController.getDashboard);
router.get('/profile', ensureAuthenticated, dashboardController.getProfile);
router.post('/profile', ensureAuthenticated, dashboardController.updateProfile);

module.exports = router;
