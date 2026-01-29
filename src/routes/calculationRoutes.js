import { Router } from 'express';
import { calculatePowerLoss } from '../controllers/calculationController.js';
import { validatePowerLossRequest } from '../middleware/calculationValidation.middleware.js';

const router = Router();

/**
 * @route POST /api/calculate-power
 * @desc Calcula pérdidas de potencia para un tractor en un terreno
 * @access Public (en producción debería tener auth middleware)
 */
router.post('/calculate-power', validatePowerLossRequest, calculatePowerLoss);

export default router;
