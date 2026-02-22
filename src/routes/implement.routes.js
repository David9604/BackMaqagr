import { Router } from 'express';
import {
  getAllImplements,
  getAvailableImplements,
  searchImplements,
  getImplementById,
  createImplement,
  updateImplement,
  deleteImplement,
} from '../controllers/implementController.js';
import {
  verifyTokenMiddleware,
  isAdmin,
} from '../middleware/auth.middleware.js';
import { validateImplement } from '../middleware/validation.middleware.js';

import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

// Rutas públicas para el catálogo de implementos
router.get('/', cacheMiddleware(86400), getAllImplements);
router.get('/available', getAvailableImplements);
router.get('/search', searchImplements);
router.get('/:id', getImplementById);

// Rutas protegidas (solo admin)
router.post('/', verifyTokenMiddleware, isAdmin, validateImplement, invalidateCacheMiddleware('*implements*'), createImplement);
router.put('/:id', verifyTokenMiddleware, isAdmin, validateImplement, invalidateCacheMiddleware(['*implements*', '*recommendations*']), updateImplement);
router.delete('/:id', verifyTokenMiddleware, isAdmin, invalidateCacheMiddleware(['*implements*', '*recommendations*']), deleteImplement);

export default router;

