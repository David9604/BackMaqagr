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

const router = Router();

// Rutas públicas para el catálogo de implementos
router.get('/', getAllImplements);
router.get('/available', getAvailableImplements);
router.get('/search', searchImplements);
router.get('/:id', getImplementById);

// Rutas protegidas (solo admin)
router.post('/', verifyTokenMiddleware, isAdmin, validateImplement, createImplement);
router.put('/:id', verifyTokenMiddleware, isAdmin, validateImplement, updateImplement);
router.delete('/:id', verifyTokenMiddleware, isAdmin, deleteImplement);

export default router;

