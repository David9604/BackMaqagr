import { Router } from 'express';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';
import {
  exportTractorsCatalog,
  exportUserRecommendationsPdf,
} from '../controllers/exportController.js';

const router = Router();

// Exportaciones disponibles para usuarios autenticados
/**
 * @swagger
 * /api/exports/tractors:
 *   get:
 *     summary: Exportar catálogo de tractores en CSV
 *     description: |
 *       Exporta el catálogo completo de tractores en formato CSV.
 *       Debe enviarse `format=csv`.
 *     tags: [Exports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Archivo CSV generado exitosamente
 *       400:
 *         description: Formato inválido
 *       401:
 *         description: Token no proporcionado o inválido
 */
router.get('/tractors', verifyTokenMiddleware, exportTractorsCatalog);

/**
 * @swagger
 * /api/exports/recommendations:
 *   get:
 *     summary: Exportar recomendaciones del usuario en PDF
 *     description: |
 *       Exporta las recomendaciones del usuario autenticado en formato PDF.
 *       Debe enviarse `format=pdf`.
 *     tags: [Exports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf]
 *     responses:
 *       200:
 *         description: Archivo PDF generado exitosamente
 *       400:
 *         description: Formato inválido
 *       401:
 *         description: Token no proporcionado o inválido
 */
router.get('/recommendations', verifyTokenMiddleware, exportUserRecommendationsPdf);

export default router;
