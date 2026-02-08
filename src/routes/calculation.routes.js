import { Router } from 'express';
import { calculatePowerLoss, calculateMinimumPower, getCalculationHistory } from '../controllers/calculationController.js';
import { validatePowerLossRequest, validateImplementRequirement } from '../middleware/calculationValidation.middleware.js';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// ============================================
// RUTAS DE CÁLCULOS
// Base path: /api/calculations
// ============================================

/**
 * @route POST /api/calculations/power-loss
 * @desc Calcula pérdidas de potencia para un tractor en un terreno específico
 * @access Protected (JWT)
 */
router.post('/power-loss', verifyTokenMiddleware, validatePowerLossRequest, calculatePowerLoss);

/**
 * @route POST /api/calculations/minimum-power
 * @desc Calcula potencia mínima requerida para un implemento y recomienda tractores compatibles
 * @access Protected (JWT)
 * @body {number} implement_id - ID del implemento agrícola
 * @body {number} terrain_id - ID del terreno
 * @body {number} [working_depth_m] - Profundidad de trabajo opcional (m), máx 1.0
 */
router.post('/minimum-power', verifyTokenMiddleware, validateImplementRequirement, calculateMinimumPower);

/**
 * @route GET /api/calculations/history
 * @desc Obtiene el historial de cálculos del usuario autenticado
 * @access Protected (JWT)
 * @query {number} [page=1] - Número de página
 * @query {number} [limit=10] - Registros por página (máx: 100)
 * @query {string} [type] - Filtro por tipo: 'power_loss' | 'minimum_power'
 */
router.get('/history', verifyTokenMiddleware, getCalculationHistory);

export default router;
