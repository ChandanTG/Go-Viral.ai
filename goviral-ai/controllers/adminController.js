// controllers/adminController.js – Admin dashboard & user analytics
const User = require('../models/User');
const Content = require('../models/Content');

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const totalContent = await Content.countDocuments({ isDeleted: false });
    const analyzedContent = await Content.countDocuments({ isDeleted: false, 'analysis.status': 'completed' });

    // Recent users
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt totalUploads lastLogin isActive');

    // Top viral content
    const topContent = await Content.find({ isDeleted: false, 'analysis.status': 'completed' })
      .sort({ 'analysis.viralityScore': -1 })
      .limit(5)
      .populate('user', 'name email');

    // Platform distribution
    const platformDist = await Content.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Score distribution
    const scoreDist = await Content.aggregate([
      { $match: { isDeleted: false, 'analysis.status': 'completed' } },
      {
        $bucket: {
          groupBy: '$analysis.viralityScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Monthly signups (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'user' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard – Go Viral AI',
      user: req.user,
      stats: { totalUsers, activeUsers, totalContent, analyzedContent },
      recentUsers,
      topContent,
      platformDist,
      scoreDist,
      monthlySignups,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Failed to load admin dashboard.');
    res.redirect('/dashboard');
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('admin/users', {
      title: 'Manage Users – Go Viral AI Admin',
      user: req.user,
      users,
      pagination: { page, totalPages, total, limit },
      search,
    });
  } catch (err) {
    req.flash('error', 'Failed to load users.');
    res.redirect('/admin/dashboard');
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    const contents = await Content.find({ user: targetUser._id, isDeleted: false })
      .sort({ createdAt: -1 });

    // User analytics
    const avgScore = contents.filter(c => c.analysis.status === 'completed').length
      ? Math.round(
          contents
            .filter(c => c.analysis.status === 'completed')
            .reduce((acc, c) => acc + c.analysis.viralityScore, 0) /
            contents.filter(c => c.analysis.status === 'completed').length
        )
      : 0;

    const platformUsage = contents.reduce((acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {});

    const ratingDist = contents.reduce((acc, c) => {
      if (c.analysis.overallRating) {
        acc[c.analysis.overallRating] = (acc[c.analysis.overallRating] || 0) + 1;
      }
      return acc;
    }, {});

    res.render('admin/user-detail', {
      title: `${targetUser.name} – Admin View`,
      user: req.user,
      targetUser,
      contents,
      analytics: { avgScore, platformUsage, ratingDist },
    });
  } catch (err) {
    req.flash('error', 'Failed to load user details.');
    res.redirect('/admin/users');
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || targetUser.role === 'admin') {
      return res.json({ success: false, message: 'User not found or cannot modify admin.' });
    }
    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();
    res.json({ success: true, isActive: targetUser.isActive });
  } catch (err) {
    res.json({ success: false, message: 'Failed to update user status.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || targetUser.role === 'admin') {
      req.flash('error', 'Cannot delete this user.');
      return res.redirect('/admin/users');
    }
    await Content.deleteMany({ user: targetUser._id });
    await User.findByIdAndDelete(targetUser._id);
    req.flash('success', 'User deleted successfully.');
    res.redirect('/admin/users');
  } catch (err) {
    req.flash('error', 'Failed to delete user.');
    res.redirect('/admin/users');
  }
};

exports.getContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      Content.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email'),
      Content.countDocuments({ isDeleted: false }),
    ]);

    res.render('admin/content', {
      title: 'All Content – Go Viral AI Admin',
      user: req.user,
      contents,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (err) {
    req.flash('error', 'Failed to load content.');
    res.redirect('/admin/dashboard');
  }
};
