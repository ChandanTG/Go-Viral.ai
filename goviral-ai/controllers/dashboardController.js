// controllers/dashboardController.js – User dashboard logic
const Content = require('../models/Content');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {
  try {
    const contents = await Content.find({ user: req.user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10);

    const totalUploads = await Content.countDocuments({ user: req.user._id, isDeleted: false });
    const analyzed = await Content.countDocuments({
      user: req.user._id,
      isDeleted: false,
      'analysis.status': 'completed',
    });

    // Average virality score
    const scoreAgg = await Content.aggregate([
      { $match: { user: req.user._id, isDeleted: false, 'analysis.status': 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$analysis.viralityScore' } } },
    ]);

    const avgScore = scoreAgg.length ? Math.round(scoreAgg[0].avgScore) : 0;

    res.render('dashboard/index', {
      title: 'Dashboard – Go Viral AI',
      user: req.user,
      contents,
      stats: { totalUploads, analyzed, avgScore },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const contents = await Content.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
    res.render('dashboard/profile', {
      title: 'Profile – Go Viral AI',
      user: req.user,
      contents,
    });
  } catch (err) {
    req.flash('error', 'Failed to load profile.');
    res.redirect('/dashboard');
  }
};

exports.updateProfile = async (req, res) => {
  const { name, metaAccessToken, metaInstagramUserId, metaFacebookPageId } = req.body;
  try {
    await User.findByIdAndUpdate(req.user._id, { 
      name,
      metaAccessToken,
      metaInstagramUserId,
      metaFacebookPageId
    });
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/dashboard/profile');
  } catch (err) {
    req.flash('error', 'Failed to update profile.');
    res.redirect('/dashboard/profile');
  }
};
