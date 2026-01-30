/**
 * Rutas de Autenticación
 * Endpoints públicos y protegidos para auth
 */

import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/register - Registro de nuevos usuarios
router.post('/register', register);

// POST /api/auth/login - Inicio de sesión
router.post('/login', login);

// POST /api/auth/logout - Cierre de sesión (requiere autenticación)
router.post('/logout', verifyTokenMiddleware, logout);

export default router;

