// middlewares/upload.js – Multer file upload configuration
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage: cloudinaryStorage } = require('../config/cloudinary');

// Ensure local uploads directory exists (for fallback)
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const mongoose = require('mongoose');

// Local storage configuration
const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `content-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// Custom GridFS Storage Engine
const { GridFSBucket } = require('mongodb');

class GridFsCustomStorage {
  constructor() {
    this.db = null;
    this.bucket = null;
    
    const init = () => {
      this.db = mongoose.connection.db;
      this.bucket = new GridFSBucket(this.db, { bucketName: 'uploads' });
    };

    if (mongoose.connection.readyState === 1) {
      init();
    } else {
      mongoose.connection.once('open', init);
    }
  }

  _handleFile(req, file, cb) {
    if (!this.bucket) {
      return cb(new Error('Database not connected yet.'));
    }

    const filename = `content-${Date.now()}-${file.originalname}`;
    const uploadStream = this.bucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: { originalName: file.originalname }
    });

    file.stream.pipe(uploadStream);

    uploadStream.on('error', (err) => cb(err));
    uploadStream.on('finish', () => {
      cb(null, {
        id: uploadStream.id,
        filename: filename,
        bucketName: 'uploads',
        size: uploadStream.length
      });
    });
  }

  _removeFile(req, file, cb) {
    this.bucket.delete(file.id, cb);
  }
}

const gridFsStorage = new GridFsCustomStorage();

// File filter – allow images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

// Selection Logic: Cloudinary > GridFS > Local
const isCloudinaryConfigured = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key';

const upload = multer({
  storage: isCloudinaryConfigured ? cloudinaryStorage : gridFsStorage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

module.exports = upload;
