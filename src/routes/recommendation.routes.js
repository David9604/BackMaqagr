import { Router } from 'express';
import { 
  generateRecommendation, 
  getRecommendationHistory, 
  getRecommendationById 
} from '../controllers/recommendationController.js';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// RUTAS DE RECOMENDACIONES
// Base path: /api/recommendations

/**
 * @route POST /api/recommendations/generate
 * @desc Genera recomendaciones de tractores para un terreno e implemento
 * @access Protected (JWT)
 * @body {number} terrain_id - ID del terreno (requerido)
 * @body {number} implement_id - ID del implemento agrícola (requerido)
 * @body {number} [working_depth_m] - Profundidad de trabajo opcional (m)
 * @body {string} [work_type] - Tipo de trabajo (tillage, planting, harvesting, transport, general)
 */
router.post('/generate', verifyTokenMiddleware, generateRecommendation);

/**
 * @route GET /api/recommendations/history
 * @desc Obtiene el historial de recomendaciones del usuario autenticado
 * @access Protected (JWT)
 * @query {number} [page=1] - Número de página
 * @query {number} [limit=10] - Registros por página (máx: 50)
 * @query {string} [work_type] - Filtro por tipo de trabajo
 */
router.get('/history', verifyTokenMiddleware, getRecommendationHistory);

/**
 * @route GET /api/recommendations/:id
 * @desc Obtiene los detalles de una recomendación específica
 * @access Protected (JWT)
 * @param {number} id - ID de la recomendación
 */
router.get('/:id', verifyTokenMiddleware, getRecommendationById);

export default router;
