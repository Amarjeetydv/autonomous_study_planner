const multer = require('multer');
const sharp = require('sharp');
const { Readable } = require('stream');

const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { FILE_TYPES } = require('../enums');

const buildMaxBytes = (sizeInMb = env.upload.maxFileSizeMb) => sizeInMb * 1024 * 1024;

const validateImageFile = (file, allowedMimeTypes = env.upload.allowedImageMimeTypes) => {
  if (!file) {
    throw new AppError('File is required', 400);
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError('Unsupported file type', 400);
  }

  return true;
};

const createMulterUploader = ({ maxFileSizeMb = env.upload.maxFileSizeMb, allowedMimeTypes = env.upload.allowedImageMimeTypes } = {}) =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: buildMaxBytes(maxFileSizeMb),
    },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new AppError('Unsupported file type', 400));
      }

      return cb(null, true);
    },
  });

const optimizeImageBuffer = async (buffer, { width = 1600, height = null, quality = 80 } = {}) =>
  sharp(buffer)
    .resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

const uploadBufferToCloudinary = (buffer, { folder = env.cloudinary.folder, publicId, resourceType = 'image' } = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });

const uploadImage = async (file, options = {}) => {
  validateImageFile(file, options.allowedMimeTypes);

  const optimizedBuffer = options.optimize === false ? file.buffer : await optimizeImageBuffer(file.buffer, options.optimization);

  return uploadBufferToCloudinary(optimizedBuffer, {
    folder: options.folder,
    publicId: options.publicId,
    resourceType: FILE_TYPES.IMAGE,
  });
};

const deleteFile = async (publicId, { resourceType = FILE_TYPES.IMAGE } = {}) => {
  if (!publicId) {
    throw new AppError('Public ID is required', 400);
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  createMulterUploader,
  validateImageFile,
  optimizeImageBuffer,
  uploadBufferToCloudinary,
  uploadImage,
  deleteFile,
};
