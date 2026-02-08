import { Router } from 'express';
import {
  getAllImplements,
  getAvailableImplements,
  searchImplements,
  getImplementById,
} from '../controllers/implementController.js';

const router = Router();

// Rutas públicas para el catálogo de implementos
router.get('/', getAllImplements);
router.get('/available', getAvailableImplements);
router.get('/search', searchImplements);
router.get('/:id', getImplementById);

export default router;
