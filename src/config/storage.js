/**
* Google Cloud Storage Configuration
* Handles file uploads to Firebase Storage bucket
*
* In production (Cloud Run): GCS_BUCKET_NAME is REQUIRED — app crashes if missing.
* In development: GCS is optional — uploads are disabled gracefully.
*/
import { Storage } from '@google-cloud/storage';
import path from 'path';
import logger from '../utils/logger.js';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || '';

if (IS_PRODUCTION && !BUCKET_NAME) {
  throw new Error('GCS_BUCKET_NAME environment variable is required in production');
}

// Initialize GCS client only when bucket name is available
const storage = BUCKET_NAME ? new Storage() : null;
const bucket = BUCKET_NAME && storage ? storage.bucket(BUCKET_NAME) : null;

if (!bucket && !IS_PRODUCTION) {
  logger.warn('GCS_BUCKET_NAME not set — image uploads will be disabled in development mode');
}

/**
 * Upload a file to Google Cloud Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} destination - Destination path in the bucket (e.g., 'tractors/john-deere.jpg')
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} Public URL of the uploaded file
 * @throws {Error} If GCS is not configured (dev without bucket)
 */
export const uploadToGCS = async (buffer, destination, contentType) => {
  if (!bucket) {
    throw new Error('GCS upload not available: GCS_BUCKET_NAME is not configured. Set it in .env for local dev or run in production.');
  }

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
 * @returns {Promise<boolean>} True if deleted, false if not found or GCS unavailable
 */
export const deleteFromGCS = async (destination) => {
  if (!bucket) {
    logger.warn('GCS delete skipped: bucket not configured');
    return false;
  }
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

export default { uploadToGCS, deleteFromGCS, extractGCSPath, bucket, BUCKET_NAME, isAvailable: !!bucket };