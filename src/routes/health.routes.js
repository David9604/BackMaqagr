/**
 * DDAAM-112: Health Check Routes
 * GET /health           → status público
 * GET /health/detailed  → diagnóstico completo (solo admin)
 */

import { Router } from 'express';
import { getHealth, getHealthDetailed } from '../controllers/healthController.js';
import { verifyTokenMiddleware, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Público — sin autenticación
router.get('/', getHealth);

// Protegido — sólo administradores
router.get('/detailed', verifyTokenMiddleware, isAdmin, getHealthDetailed);

export default router;
