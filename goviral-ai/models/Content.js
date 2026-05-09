// models/Content.js – Uploaded content with virality analysis results
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // File info
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'video'], required: true },
    fileSize: { type: Number }, // bytes
    mimetype: { type: String },
    filePath: { type: String }, // Local path (optional for Cloudinary/GridFS)

    // Platform target
    platform: {
      type: String,
      enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'],
      default: 'instagram',
    },

    // AI Analysis Results
    analysis: {
      viralityScore: { type: Number, min: 0, max: 100, default: 0 },
      hookStrength: { type: Number, min: 0, max: 100, default: 0 },
      engagementPotential: { type: Number, min: 0, max: 100, default: 0 },
      trendAlignment: { type: Number, min: 0, max: 100, default: 0 },
      emotionalImpact: { type: Number, min: 0, max: 100, default: 0 },

      // Text results
      overallRating: { type: String, enum: ['Poor', 'Average', 'Good', 'Excellent', 'Viral'], default: 'Average' },
      captionSuggestions: [{ type: String }],
      hashtags: [{ type: String }],
      improvements: [{ type: String }],
      strengths: [{ type: String }],
      bestPostingTime: { type: String },
      estimatedReach: { type: String },

      // Analysis status
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
      },
      analyzedAt: { type: Date },
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    // Direct Posting Info
    profileLink: { type: String, trim: true, default: null },
    postStatus: { 
      type: String, 
      enum: ['not_posted', 'posting', 'posted', 'failed'], 
      default: 'not_posted' 
    },
    postUrl: { type: String, default: null },
    platformPostId: { type: String, default: null },
    postError: { type: String, default: null },
    
    // Cloudinary Storage Info
    cloudinaryPublicId: { type: String, default: null },

    // GridFS Storage Info (MongoDB)
    gridfsId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// Virtual for file URL
contentSchema.virtual('fileUrl').get(function () {
  if (this.filePath && (this.filePath.startsWith('http://') || this.filePath.startsWith('https://'))) {
    return this.filePath;
  }
  if (this.gridfsId) {
    return `/content/file/${this._id}`;
  }
  return `/uploads/${this.filename}`;
});

contentSchema.set('toJSON', { virtuals: true });
contentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Content || mongoose.model('Content', contentSchema);
