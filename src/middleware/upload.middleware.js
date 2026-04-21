/**
 * Upload Middleware using Multer
 * Handles multipart/form-data file uploads for images
 */
import multer from 'multer';

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

// Multer storage configuration (memory storage - files are buffers, not saved to disk)
const storage = multer.memoryStorage();

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Multer middleware for single image upload
 * Usage: router.post('/tractors', verifyTokenMiddleware, isAdmin, uploadMiddleware, createTractor)
 */
export const uploadMiddleware = upload.single('image');

/**
 * Multer middleware for multiple images (not used currently but ready)
 * Usage: router.post('/gallery', verifyTokenMiddleware, isAdmin, upload.arrayMiddleware, createGallery)
 */
export const uploadArrayMiddleware = upload.array('images', 5);

export default uploadMiddleware;