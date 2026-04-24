/**
 * Google Cloud Storage Configuration
 * Handles file uploads to Firebase Storage bucket
 */
import { Storage } from '@google-cloud/storage';
import path from 'path';
import logger from '../utils/logger.js';

// Initialize GCS client
// In Cloud Run, credentials are automatically provided via workload identity
// In development, uses GOOGLE_APPLICATION_CREDENTIALS env var or gcloud CLI
const storage = new Storage();

if (!process.env.GCS_BUCKET_NAME) {
  throw new Error('GCS_BUCKET_NAME environment variable is required');
}
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(BUCKET_NAME);

/**
 * Upload a file to Google Cloud Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} destination - Destination path in the bucket (e.g., 'tractors/john-deere.jpg')
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadToGCS = async (buffer, destination, contentType) => {
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
    public: true,
    resumable: false,
  });

  // Make the file publicly accessible
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;

  logger.info('File uploaded to GCS', { destination, contentType });

  return publicUrl;
};

/**
 * Delete a file from Google Cloud Storage
 * @param {string} destination - Path of the file in the bucket
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteFromGCS = async (destination) => {
  try {
    const file = bucket.file(destination);
    const [exists] = await file.exists();

    if (!exists) {
      return false;
    }

    await file.delete();
    logger.info('File deleted from GCS', { destination });
    return true;
  } catch (error) {
    logger.warn('Error deleting file from GCS', { destination, error: error.message });
    return false;
  }
};

/**
 * Extract the destination path from a public URL
 * @param {string} url - Public URL of the file
 * @returns {string|null} Destination path or null if not a GCS URL
 */
export const extractGCSPath = (url) => {
  if (!url) return null;

  const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length);
  }

  return null;
};

export default { uploadToGCS, deleteFromGCS, extractGCSPath, bucket, BUCKET_NAME };