// controllers/contentController.js – Content upload & AI analysis logic
const Content = require('../models/Content');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

// Initialize GridFS
let gfs;
const conn = mongoose.connection;
if (conn.readyState === 1) {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
} else {
  conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
  });
}

// ─── AI Virality Engine (Mock + Advanced Logic) ────────────────────────────

const analyzeContent = (file, platform, title, description) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mpeg'].includes(ext.replace('.', ''));
  const fileSize = file.size;

  // Simulated intelligent scoring based on multiple factors
  const baseScore = Math.floor(Math.random() * 30) + 50; // 50–80 base

  // Platform boosts
  const platformBoosts = { tiktok: 8, instagram: 6, youtube: 5, twitter: 4, facebook: 3, linkedin: 2 };
  const platformBoost = platformBoosts[platform] || 0;

  // Content type bonus
  const typeBonus = isVideo ? 12 : 5;

  // Description quality boost
  const descBonus = description && description.length > 50 ? 5 : 0;
  const titleBonus = title && title.length > 10 && title.length < 60 ? 3 : 0;

  // File size factor (sweet spot 1MB-20MB)
  const sizeMB = fileSize / (1024 * 1024);
  const sizeBonus = sizeMB > 1 && sizeMB < 20 ? 4 : 0;

  const raw = baseScore + platformBoost + typeBonus + descBonus + titleBonus + sizeBonus;
  const viralityScore = Math.min(99, Math.max(20, raw));

  const hookStrength = Math.floor(Math.random() * 30) + (isVideo ? 55 : 45);
  const engagementPotential = Math.floor(viralityScore * 0.85 + Math.random() * 15);
  const trendAlignment = Math.floor(Math.random() * 35) + 50;
  const emotionalImpact = Math.floor(Math.random() * 30) + 55;

  // Rating
  let overallRating;
  if (viralityScore >= 85) overallRating = 'Viral';
  else if (viralityScore >= 70) overallRating = 'Excellent';
  else if (viralityScore >= 55) overallRating = 'Good';
  else if (viralityScore >= 35) overallRating = 'Average';
  else overallRating = 'Poor';

  // Platform-specific captions
  const captionTemplates = {
    tiktok: [
      `🔥 ${title} – This is the content you didn't know you needed! Drop a comment if this hit different 👇`,
      `POV: You just discovered the secret to ${title.split(' ').slice(0, 3).join(' ')} ✨ #viral #fyp`,
      `Not me staying up till 3am to share this with you 😭 ${title} hits DIFFERENT at night`,
    ],
    instagram: [
      `✨ ${title}\n\nSave this post for later – you'll thank me! 🙌\n\n👇 Tag someone who needs to see this`,
      `The ${title} era has officially arrived 🚀\n\n📌 Save • ❤️ Like • 🔁 Share`,
      `Real talk: ${description ? description.substring(0, 60) : title}... and this is just the beginning 💫`,
    ],
    youtube: [
      `${title} – Everything You Need to Know (Honest Review)`,
      `I tried ${title} for 30 days... here's what happened 📊`,
      `Why ${title} is changing EVERYTHING in 2024`,
    ],
    twitter: [
      `Thread: ${title} is not what you think it is 🧵`,
      `Hot take: ${title} is the most underrated thing right now 🔥`,
      `Just dropped everything to share this about ${title} – you need to see this`,
    ],
    facebook: [
      `Friends, you have to see this! ${title} – sharing because this genuinely blew my mind 🤯`,
      `${title} – Tag someone who would love this! Drop a ❤️ if you agree`,
    ],
    linkedin: [
      `Insights on ${title}: What the data reveals about the future of content. Thoughts? 👇`,
      `3 key lessons from ${title} that every professional should know in 2024 💼`,
    ],
  };

  const captions = captionTemplates[platform] || captionTemplates.instagram;

  // Hashtags
  const hashtagSets = {
    tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#tiktoktrend', '#content', '#creator', '#viralvideo'],
    instagram: ['#instagood', '#viral', '#reels', '#content', '#trending', '#explore', '#instadaily', '#creator'],
    youtube: ['#youtube', '#viral', '#trending', '#shorts', '#content', '#subscribe', '#youtubeshorts'],
    twitter: ['#viral', '#trending', '#thread', '#content', '#socialmedia'],
    facebook: ['#facebook', '#viral', '#share', '#content', '#trending'],
    linkedin: ['#linkedin', '#professional', '#content', '#viral', '#marketing', '#growth'],
  };

  const hashtags = hashtagSets[platform] || hashtagSets.instagram;

  // Improvements
  const improvements = [
    isVideo ? 'Hook viewers within the first 2 seconds with a surprising visual or statement' : 'Add motion/animation to make static content more dynamic',
    'Use bold, contrasting text overlays to increase readability',
    'Add trending audio or background music to boost reach',
    engagementPotential < 70 ? 'Include a clear call-to-action (like, share, comment)' : 'Your CTA is strong – maintain this approach',
    trendAlignment < 65 ? 'Align content with current trending topics for higher visibility' : 'Great trend alignment!',
    'Post during peak hours: 6–9 PM on weekdays',
    'Engage with comments within the first 30 minutes of posting',
  ].slice(0, 5);

  // Strengths
  const strengths = [
    viralityScore > 70 ? '✅ High virality potential detected' : '✅ Solid content foundation',
    isVideo ? '✅ Video content performs 3x better than static' : '✅ Strong visual composition',
    hookStrength > 65 ? '✅ Excellent hook strength for the first 3 seconds' : '✅ Decent opening moment',
    emotionalImpact > 70 ? '✅ Strong emotional resonance with target audience' : '✅ Good emotional connection',
    '✅ Platform-optimized content format',
  ];

  // Best posting time
  const postingTimes = {
    tiktok: '7 PM – 9 PM (Tue, Thu, Fri)',
    instagram: '6 PM – 8 PM (Mon, Wed, Fri)',
    youtube: '2 PM – 4 PM (Fri, Sat)',
    twitter: '12 PM – 1 PM (Mon–Wed)',
    facebook: '1 PM – 3 PM (Wed, Thu)',
    linkedin: '8 AM – 10 AM (Tue, Wed)',
  };

  const estimatedReach = viralityScore > 80
    ? `${(Math.floor(Math.random() * 500) + 100)}K – ${(Math.floor(Math.random() * 2000) + 500)}K`
    : viralityScore > 60
    ? `${(Math.floor(Math.random() * 50) + 20)}K – ${(Math.floor(Math.random() * 200) + 100)}K`
    : `${(Math.floor(Math.random() * 10) + 5)}K – ${(Math.floor(Math.random() * 50) + 20)}K`;

  return {
    viralityScore,
    hookStrength,
    engagementPotential,
    trendAlignment,
    emotionalImpact,
    overallRating,
    captionSuggestions: captions,
    hashtags,
    improvements,
    strengths,
    bestPostingTime: postingTimes[platform] || '6 PM – 8 PM',
    estimatedReach,
    status: 'completed',
    analyzedAt: new Date(),
  };
};

// ─── Routes ───────────────────────────────────────────────────────────────────

exports.getUpload = (req, res) => {
  res.render('dashboard/upload', {
    title: 'Upload Content – Go Viral AI',
    user: req.user,
    errors: [],
  });
};

exports.postUpload = async (req, res) => {
  if (!req.file) {
    return res.render('dashboard/upload', {
      title: 'Upload Content – Go Viral AI',
      user: req.user,
      errors: [{ msg: 'Please select a file to upload.' }],
    });
  }

  const { title, description, platform } = req.body;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const videoExts = ['.mp4', '.mov', '.avi', '.webm', '.mpeg', '.mkv'];
  const fileType = videoExts.includes(ext) ? 'video' : 'image';

  try {
    // Debug: log what multer gives us
    console.log('📦 req.file keys:', Object.keys(req.file));
    console.log('📦 req.file.id:', req.file.id);
    console.log('📦 req.file.filename:', req.file.filename);
    console.log('📦 req.file.path:', req.file.path);
    console.log('📦 req.file.size:', req.file.size);

    // Build content data dynamically
    const contentData = {
      user: req.user._id,
      title: title || 'Untitled Content',
      description,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      platform: platform || 'instagram',
      analysis: { status: 'processing' },
    };

    // Only set filePath if we have a local path
    if (req.file.path) {
      contentData.filePath = req.file.path;
    }

    // GridFS: store the ObjectId
    if (req.file.id) {
      contentData.gridfsId = req.file.id;
    }

    // Cloudinary: store the public_id
    if (req.file.path && String(req.file.path).includes('cloudinary')) {
      contentData.cloudinaryPublicId = req.file.filename;
    }

    const content = await Content.create(contentData);

    // Update user upload count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalUploads: 1 } });

    // Simulate AI processing delay then analyze
    setTimeout(async () => {
      try {
        const analysisResult = analyzeContent(req.file, platform, title, description);
        await Content.findByIdAndUpdate(content._id, { analysis: analysisResult });
      } catch (e) {
        console.error('Analysis error:', e);
      }
    }, 2000);

    // XHR uploads need JSON response (redirect doesn't work with XHR)
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ success: true, redirectUrl: `/content/results/${content._id}` });
    }
    res.redirect(`/content/results/${content._id}`);
  } catch (err) {
    console.error('Upload error:', err);
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ success: false, message: err.message });
    }
    req.flash('error', 'Upload failed. Please try again.');
    res.redirect('/content/upload');
  }
};

exports.getFile = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.gridfsId) {
      return res.status(404).send('File not found');
    }

    const readstream = gfs.createReadStream({
      _id: content.gridfsId,
      root: 'uploads'
    });

    res.set('Content-Type', content.mimetype);
    readstream.pipe(res);
  } catch (err) {
    res.status(500).send('Error streaming file');
  }
};

exports.getResults = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
    if (!content) {
      req.flash('error', 'Content not found.');
      return res.redirect('/dashboard');
    }

    // If still processing, poll
    res.render('dashboard/results', {
      title: 'Analysis Results – Go Viral AI',
      user: req.user,
      content,
    });
  } catch (err) {
    req.flash('error', 'Failed to load results.');
    res.redirect('/dashboard');
  }
};

exports.getAnalysisStatus = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.json({ status: 'not_found' });
    res.json({ status: content.analysis.status, analysis: content.analysis });
  } catch (err) {
    res.json({ status: 'error' });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, user: req.user._id });
    if (!content) {
      return res.json({ success: false, message: 'Content not found.' });
    }

    // Soft delete
    content.isDeleted = true;
    content.deletedAt = new Date();
    await content.save();

    // Remove file from local storage
    if (fs.existsSync(content.filePath)) {
      fs.unlinkSync(content.filePath);
    }

    // Remove from Cloudinary if exists
    if (content.cloudinaryPublicId) {
      const { cloudinary } = require('../config/cloudinary');
      await cloudinary.uploader.destroy(content.cloudinaryPublicId, { resource_type: content.fileType });
    }

    // Remove from GridFS if exists
    if (content.gridfsId && gfs) {
      gfs.remove({ _id: content.gridfsId, root: 'uploads' }, (err) => {
        if (err) console.error('GridFS Delete Error:', err);
      });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalUploads: -1 } });

    res.json({ success: true, message: 'Content deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.json({ success: false, message: 'Delete failed.' });
  }
};
