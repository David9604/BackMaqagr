import { Router } from 'express';
import {
  getAllTractors,
  getAvailableTractors,
  searchTractors,
  getTractorById,
  createTractor,
  updateTractor,
  deleteTractor,
} from '../controllers/tractorController.js';
import {
  verifyTokenMiddleware,
  isAdmin,
} from '../middleware/auth.middleware.js';
import { validateTractor } from '../middleware/validation.middleware.js';

import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

// Rutas públicas para el catálogo de tractores
router.get('/', cacheMiddleware(86400), getAllTractors);
router.get('/available', getAvailableTractors);
router.get('/search', searchTractors);
router.get('/:id', getTractorById);

router.post('/', verifyTokenMiddleware, isAdmin, validateTractor, invalidateCacheMiddleware('*tractors*'), createTractor);
router.put('/:id', verifyTokenMiddleware, isAdmin, validateTractor, invalidateCacheMiddleware(['*tractors*', '*recommendations*']), updateTractor);
router.delete('/:id', verifyTokenMiddleware, isAdmin, invalidateCacheMiddleware(['*tractors*', '*recommendations*']), deleteTractor);

export default router;
