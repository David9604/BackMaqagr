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

const router = Router();

// Rutas públicas para el catálogo de tractores
router.get('/', getAllTractors);
router.get('/available', getAvailableTractors);
router.get('/search', searchTractors);
router.get('/:id', getTractorById);

router.post('/', verifyTokenMiddleware, isAdmin, validateTractor, createTractor);
router.put('/:id', verifyTokenMiddleware, isAdmin, validateTractor, updateTractor);
router.delete('/:id', verifyTokenMiddleware, isAdmin, deleteTractor);

export default router;
