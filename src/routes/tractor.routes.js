import { Router } from 'express';
import {
  getAllTractors,
  getAvailableTractors,
  searchTractors,
  getTractorById,
} from '../controllers/tractorController.js';

const router = Router();

// Rutas públicas para el catálogo de tractores
router.get('/', getAllTractors);
router.get('/available', getAvailableTractors);
router.get('/search', searchTractors);
router.get('/:id', getTractorById);

export default router;
