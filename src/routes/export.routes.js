import { Router } from 'express';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';
import {
  exportTractorsCatalog,
  exportUserRecommendationsPdf,
} from '../controllers/exportController.js';

const router = Router();

// Exportaciones disponibles para usuarios autenticados
router.get('/tractors', verifyTokenMiddleware, exportTractorsCatalog);
router.get('/recommendations', verifyTokenMiddleware, exportUserRecommendationsPdf);

export default router;
