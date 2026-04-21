/**
 * Upload Routes
 * Image upload/delete endpoints for admin users
 */
import { Router } from 'express';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import { verifyTokenMiddleware, isAdmin } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Subir imagen al almacenamiento
 *     description: |
 *       Sube una imagen al bucket de Google Cloud Storage.
 *       **Solo administradores**. Retorna la URL pública de la imagen.
 *       Máximo 5MB, formatos: JPEG, PNG, WebP, GIF.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (máx 5MB)
 *               folder:
 *                 type: string
 *                 enum: [tractors, implements, general]
 *                 default: general
 *                 description: Carpeta de destino en el almacenamiento
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Imagen subida exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/tractors/1745234567890-my-tractor.jpg"
 *                     folder:
 *                       type: string
 *                       example: "tractors"
 *                     filename:
 *                       type: string
 *                       example: "tractors/1745234567890-my-tractor.jpg"
 *       400:
 *         description: No se proporcionó imagen o tipo inválido
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado - se requiere rol de administrador
 *       413:
 *         description: Archivo demasiado grande (máx 5MB)
 *       500:
 *         description: Error al subir la imagen
 */
router.post(
  '/',
  verifyTokenMiddleware,
  isAdmin,
  uploadMiddleware,
  uploadImage,
);

/**
 * @swagger
 * /api/upload:
 *   delete:
 *     summary: Eliminar imagen del almacenamiento
 *     description: |
 *       Elimina una imagen del bucket de Google Cloud Storage por su URL.
 *       **Solo administradores**.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/tractors/my-tractor.jpg"
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       400:
 *         description: URL no proporcionada o inválida
 *       404:
 *         description: Imagen no encontrada
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado - se requiere rol de administrador
 */
router.delete(
  '/',
  verifyTokenMiddleware,
  isAdmin,
  deleteImage,
);

export default router;