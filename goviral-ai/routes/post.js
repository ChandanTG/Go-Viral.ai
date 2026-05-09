const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.post('/save-link/:id', ensureAuthenticated, postController.saveProfileLink);
router.post('/publish/:id', ensureAuthenticated, postController.publishContent);

module.exports = router;
