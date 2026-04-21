/**
 * Upload Controller
 * Handles image uploads for tractors and implements
 * Returns public URLs after uploading to Google Cloud Storage
 */
import { uploadToGCS, deleteFromGCS, extractGCSPath } from '../config/storage.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * Upload an image and return the public URL
 * POST /api/upload
 * Accepts multipart/form-data with 'image' field
 * Optional: 'folder' field to specify subfolder (tractors, implements)
 */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'No se proporcionó ninguna imagen. Envía un archivo en el campo "image".',
    });
  }

  const { folder = 'general' } = req.body;
  const allowedFolders = ['tractors', 'implements', 'general'];

  if (!allowedFolders.includes(folder)) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: `Carpeta inválida. Opciones: ${allowedFolders.join(', ')}`,
    });
  }

  // Generate unique filename: folder/timestamp-originalname
  const timestamp = Date.now();
  const originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destination = `${folder}/${timestamp}-${originalName}`;

  try {
    const publicUrl = await uploadToGCS(
      req.file.buffer,
      destination,
      req.file.mimetype,
    );

    logger.info('Image uploaded', { url: publicUrl, folder });

    return res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: publicUrl,
        folder,
        filename: destination,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    logger.error('Error uploading image to GCS', { error: error.message });
    return res.status(500).json({
      success: false,
      code: 'UPLOAD_ERROR',
      message: 'Error al subir la imagen. Intenta de nuevo.',
    });
  }
});

/**
 * Delete an image from storage by URL
 * DELETE /api/upload
 * Accepts JSON body with 'url' field
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'URL de imagen es requerida',
    });
  }

  const gcsPath = extractGCSPath(url);

  if (!gcsPath) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'La URL no pertenece al almacenamiento del proyecto',
    });
  }

  const deleted = await deleteFromGCS(gcsPath);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Imagen no encontrada en el almacenamiento',
    });
  }

  logger.info('Image deleted', { url });

  return res.json({
    success: true,
    message: 'Imagen eliminada exitosamente',
  });
});

export default { uploadImage, deleteImage };