const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'goviral_uploads',
      resource_type: isVideo ? 'video' : 'image',
      public_id: `content-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      transformation: isVideo ? [
        { quality: "auto", fetch_format: "auto" }
      ] : [
        { quality: "auto", fetch_format: "auto" }
      ],
    };
  },
});

module.exports = { cloudinary, storage };
