// routes/content.js – Content upload & analysis routes
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { ensureAuthenticated } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/upload', ensureAuthenticated, contentController.getUpload);
router.post('/upload', ensureAuthenticated, upload.single('contentFile'), contentController.postUpload);
router.get('/results/:id', ensureAuthenticated, contentController.getResults);
router.get('/status/:id', ensureAuthenticated, contentController.getAnalysisStatus);
router.get('/file/:id', contentController.getFile); // Stream from GridFS
router.delete('/:id', ensureAuthenticated, contentController.deleteContent);

module.exports = router;
