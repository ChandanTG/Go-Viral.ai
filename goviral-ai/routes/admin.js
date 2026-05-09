// routes/admin.js – Admin routes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middlewares/auth');

router.get('/dashboard', ensureAdmin, adminController.getDashboard);
router.get('/users', ensureAdmin, adminController.getUsers);
router.get('/users/:id', ensureAdmin, adminController.getUserDetail);
router.post('/users/:id/toggle', ensureAdmin, adminController.toggleUserStatus);
router.post('/users/:id/delete', ensureAdmin, adminController.deleteUser);
router.get('/content', ensureAdmin, adminController.getContent);

module.exports = router;
