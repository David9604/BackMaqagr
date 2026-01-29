/**
 * Rutas de Autenticación
 * Endpoints públicos para auth
 */

import { Router } from 'express';
import { register } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register - Registro de nuevos usuarios
router.post('/register', register);

export default router;
